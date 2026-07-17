const DailyTask = require("../../models/dailytask.model");
const Progress  = require("../../models/progress.model");
const User      = require("../../models/user.model");
const AppError = require("../../utils/appError");
const { getGeminiModel } = require("../../config/gemini");


// ── Helpers ────────────────────────────────────────────────────

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function dateRange(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// GEMINI HELPERS
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const parseRetryDelay = (msg, defaultMs = 15000) => {
  const match = msg?.match(/retryDelay[^0-9]*(\d+)/);
  return match ? parseInt(match[1], 10) * 1000 : defaultMs;
};

const callGemini = async (prompt, maxRetries = 2) => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const model = getGeminiModel();

      const result = await model.generateContent({
        systemInstruction:
          "You are an AI career coach that always responds with valid JSON only.",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      const raw = result.response.text();

      if (!raw?.trim()) {
        throw new AppError(502, "AI returned an empty response.");
      }

      const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        console.error("Unparseable Gemini response:", raw);
        throw new AppError(502, "AI returned malformed JSON.");
      }
    } catch (err) {
      const msg = err.message || "";
      const is429 = msg.includes("429") || msg.includes("Too Many Requests");
      const isQuota = msg.includes("quota");

      if ((is429 || isQuota) && attempt < maxRetries) {
        const delay = parseRetryDelay(msg, 20000);
        console.warn(
          `Gemini rate limit. Retrying in ${delay / 1000}s...`
        );

        await sleep(delay);
        attempt++;
        continue;
      }

      if (isQuota && msg.includes("limit: 0")) {
        throw new AppError(
          503,
          "AI daily quota reached. Please try again tomorrow."
        );
      }

      if (is429 || isQuota) {
        throw new AppError(
          429,
          "AI service is busy. Please wait and try again."
        );
      }

      if (err.statusCode) throw err;

      throw new AppError(502, `AI service error: ${msg}`);
    }
  }
};

// ── AI Task Generation ─────────────────────────────────────────

/**
 * Calls Gemini to generate daily tasks for a given phase.
 * Returns a parsed array of task objects ready for DB insertion.
 */
async function generateTasksWithAI({
  targetCareer,
  phase,
  skillLevel,
  dailyStudyHours,
  skipPatterns,
}) {
  const taskCount =
    dailyStudyHours <= 1 ? 3 :
    dailyStudyHours <= 2 ? 5 : 7;

  const prompt = `
You are an expert career learning coach.

Generate EXACTLY ${taskCount} learning tasks.

Student Profile:
- Target Career: ${targetCareer}
- Current Phase: ${phase.title}
- Phase Summary: ${phase.summary || "No summary"}
- Topics: ${(phase.subTopics || []).map(s => s.title).join(", ") || "General"}
- Skill Level: ${skillLevel}
- Daily Study Hours: ${dailyStudyHours}

${
  skipPatterns.length
    ? `Avoid generating many tasks similar to these skipped categories: ${skipPatterns.join(", ")}`
    : ""
}

Task Types:
- reading
- video
- coding
- mini-project

Rules:
- Respond ONLY with valid JSON.
- No markdown.
- No explanations.
- Return an array only.

Example:

[
  {
    "taskType":"coding",
    "title":"Build a REST API",
    "description":"Create CRUD endpoints using Express.",
    "resourceUrl":"https://...",
    "estimatedMinutes":45
  }
]
`;

  const tasks = await callGemini(prompt);

  if (!Array.isArray(tasks)) {
    throw new AppError(502, "AI returned invalid task format.");
  }

  return tasks.slice(0, taskCount);
}

// ── Core Service Functions ─────────────────────────────────────

/**
 * Generate and save today's tasks for a user's active roadmap.
 * Skips generation if tasks already exist for today.
 */
async function generateTodaysTasks(userId, roadmap) {
  const { start, end } = todayRange();

  // Idempotency guard — don't regenerate if tasks already exist today
  const existing = await DailyTask.countDocuments({
    userId,
    roadmapId: roadmap._id,
    assignedDate: { $gte: start, $lte: end },
  });
  if (existing > 0) return null; // Already generated

  const user = await User.findById(userId).select("currentSkillLevel dailyStudyHours");
  const activePhase = roadmap.phases.find(p => p.phaseNumber === roadmap.activePhaseNumber);
  if (!activePhase) throw new Error("No active phase found on roadmap");

  // Find task types the user frequently skips (skip count >= 3)
  const skipAgg = await DailyTask.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: "skipped" } },
    { $group: { _id: "$taskType", count: { $sum: "$skipCount" } } },
    { $match: { count: { $gte: 3 } } },
  ]);
  const skipPatterns = skipAgg.map(s => s._id);

  const aiTasks = await generateTasksWithAI({
    targetCareer: roadmap.targetCareer,
    phase: activePhase,
    skillLevel: user.currentSkillLevel,
    dailyStudyHours: user.dailyStudyHours || 1,
    skipPatterns,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const docs = aiTasks.map(t => ({
    userId,
    roadmapId: roadmap._id,
    phaseNumber: roadmap.activePhaseNumber,
    taskType: t.taskType,
    title: t.title,
    description: t.description,
    resourceUrl: t.resourceUrl || null,
    estimatedMinutes: t.estimatedMinutes || 30,
    assignedDate: today,
    generatedBy: "ai",
  }));

  return DailyTask.insertMany(docs);
}

/**
 * Fetch today's tasks for a user (with optional roadmapId filter).
 */
async function getTodaysTasks(userId, roadmapId = null) {
  const { start, end } = todayRange();

  const query = {
    userId,
    assignedDate: { $gte: start, $lte: end },
  };
  if (roadmapId) query.roadmapId = roadmapId;

  const tasks = await DailyTask.find(query).sort({ taskType: 1 });

  // Day summary
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const skipped   = tasks.filter(t => t.status === "skipped").length;
  const pending   = tasks.filter(t => t.status === "pending").length;
  const xpEarned  = tasks.filter(t => t.status === "completed").reduce((s, t) => s + t.xpReward, 0);

  return {
    tasks,
    summary: { total, completed, skipped, pending, xpEarned },
  };
}

/**
 * Mark a task as completed.
 * Side effects: updates User XP + streak, syncs Progress daily history.
 */
async function completeTask(taskId, userId) {
  const task = await DailyTask.findOne({ _id: taskId, userId });
  if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });
  if (task.status !== "pending") {
    throw Object.assign(
      new Error(`Task is already ${task.status}`),
      { statusCode: 400 }
    );
  }

  task.complete();
  await task.save();

  // Update user XP and streak
  const user = await User.findById(userId);
  user.addXP(task.xpReward);
  user.updateStreak();
  await user.save();

  // Sync today's summary into Progress
  await _syncDayToProgress(userId, task.roadmapId);

  return { task, xpEarned: task.xpReward, streak: user.currentStreak };
}

/**
 * Skip a task with an optional reason.
 * Increments skip count for future deprioritisation.
 */
async function skipTask(taskId, userId, reason = null) {
  const task = await DailyTask.findOne({ _id: taskId, userId });
  if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });
  if (task.status !== "pending") {
    throw Object.assign(
      new Error(`Task is already ${task.status}`),
      { statusCode: 400 }
    );
  }

  task.skip(reason);
  await task.save();

  await _syncDayToProgress(userId, task.roadmapId);

  return task;
}

/**
 * Fetch daily task history for a date range.
 * Returns one summary object per calendar day.
 */
async function getTaskHistory(userId, startDate, endDate) {
  const { start, end } = dateRange(startDate, endDate);

  const tasks = await DailyTask.find({
    userId,
    assignedDate: { $gte: start, $lte: end },
  }).select("assignedDate status xpReward taskType roadmapId").lean();

  // Group by date string
  const byDate = {};
  for (const task of tasks) {
    const key = task.assignedDate.toISOString().split("T")[0];
    if (!byDate[key]) {
      byDate[key] = { date: key, total: 0, completed: 0, skipped: 0, pending: 0, xpEarned: 0 };
    }
    byDate[key].total += 1;
    byDate[key][task.status] += 1;
    if (task.status === "completed") byDate[key].xpEarned += task.xpReward;
  }

  // Return sorted array (oldest → newest)
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

// ── Internal helpers ───────────────────────────────────────────

/**
 * Pull today's task stats and write them into the Progress daily history.
 */
async function _syncDayToProgress(userId, roadmapId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary = await DailyTask.getDaySummary(userId, today);
  const streakMaintained = summary.completed > 0;

  const progress = await Progress.findOne({ userId, roadmapId });
  if (!progress) return;

  progress.recordDaySummary(today, {
    total: summary.total,
    completed: summary.completed,
    skipped: summary.skipped,
    xp: summary.xpEarned,
    streakMaintained,
  });

  await progress.save();
}

module.exports = {
  generateTodaysTasks,
  getTodaysTasks,
  completeTask,
  skipTask,
  getTaskHistory,
};