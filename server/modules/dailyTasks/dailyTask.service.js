const Anthropic = require("@anthropic-ai/sdk");
const DailyTask = require("../../models/DailyTask");
const Progress  = require("../../models/Progress");
const User      = require("../../models/User");

const client = new Anthropic();

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

// ── AI Task Generation ─────────────────────────────────────────

/**
 * Calls Claude to generate daily tasks for a given phase.
 * Returns a parsed array of task objects ready for DB insertion.
 */
async function generateTasksWithAI({ targetCareer, phase, skillLevel, dailyStudyHours, skipPatterns }) {
  const taskCount = dailyStudyHours <= 1 ? 3 : dailyStudyHours <= 2 ? 5 : 7;

  const prompt = `You are a career learning coach. Generate exactly ${taskCount} daily learning tasks for a student.

Student Profile:
- Target Career: ${targetCareer}
- Current Phase: Phase ${phase.phaseNumber} — "${phase.title}"
- Phase Summary: ${phase.summary || "No summary available"}
- Sub-topics in this phase: ${(phase.subTopics || []).map(s => s.title).join(", ") || "General topics"}
- Skill Level: ${skillLevel}
- Daily Study Hours: ${dailyStudyHours}

${skipPatterns.length > 0 ? `Tasks the student tends to skip (deprioritise these types): ${skipPatterns.join(", ")}` : ""}

Task type distribution (use these types only):
- reading: for articles, docs (XP: 10)
- video: for tutorials to watch (XP: 15)  
- coding: for coding exercises and challenges (XP: 25)
- mini-project: for building something small (XP: 50)

Rules:
- Tasks must directly relate to the current phase sub-topics
- Each task must be completable within the student's daily study time
- Titles must be specific and actionable (e.g. "Build a GET /users endpoint with Express")
- Descriptions must be 2-3 sentences explaining exactly what to do
- estimatedMinutes must be realistic given the task type

Respond ONLY with a valid JSON array, no markdown, no explanation:
[
  {
    "taskType": "reading|coding|video|mini-project",
    "title": "...",
    "description": "...",
    "resourceUrl": "https://... or null",
    "estimatedMinutes": 20
  }
]`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const tasks = JSON.parse(raw);

  if (!Array.isArray(tasks)) throw new Error("AI returned invalid task format");

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