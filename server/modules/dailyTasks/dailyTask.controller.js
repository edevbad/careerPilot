const asyncHandler = require("express-async-handler");
const taskService  = require("./dailyTask.service");
const Roadmap      = require("../../models/Roadmap");
const ApiResponse  = require("../../utils/ApiResponse");

// ── GET /tasks/today ───────────────────────────────────────────
/**
 * Returns today's tasks for the user.
 * Optionally scoped to a specific roadmap via ?roadmapId=
 * If no tasks exist yet for today, triggers AI generation first.
 */
const getTodaysTasks = asyncHandler(async (req, res) => {
  const userId    = req.user._id;
  const roadmapId = req.query.roadmapId || null;

  // Auto-generate if nothing exists yet for today
  if (roadmapId) {
    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId, status: "active" });
    if (!roadmap) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Roadmap not found or not active"));
    }
    await taskService.generateTodaysTasks(userId, roadmap);
  } else {
    // Generate for all active roadmaps
    const roadmaps = await Roadmap.find({ userId, status: "active" });
    await Promise.all(roadmaps.map(r => taskService.generateTodaysTasks(userId, r)));
  }

  const { tasks, summary } = await taskService.getTodaysTasks(userId, roadmapId);

  return res
    .status(200)
    .json(new ApiResponse(200, { tasks, summary }, "Today's tasks fetched successfully"));
});

// ── PATCH /tasks/:id/complete ──────────────────────────────────
/**
 * Marks a task as completed.
 * Returns the updated task, XP earned, and current streak.
 */
const completeTask = asyncHandler(async (req, res) => {
  const { id }  = req.params;
  const userId  = req.user._id;

  const result = await taskService.completeTask(id, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, `Task completed! +${result.xpEarned} XP`));
});

// ── PATCH /tasks/:id/skip ──────────────────────────────────────
/**
 * Skips a task.
 * Body: { reason?: "too-easy" | "too-hard" | "not-relevant" | "no-time" | "other" }
 */
const skipTask = asyncHandler(async (req, res) => {
  const { id }             = req.params;
  const userId             = req.user._id;
  const { reason = null }  = req.body;

  const VALID_REASONS = ["too-easy", "too-hard", "not-relevant", "no-time", "other"];
  if (reason && !VALID_REASONS.includes(reason)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, `reason must be one of: ${VALID_REASONS.join(", ")}`));
  }

  const task = await taskService.skipTask(id, userId, reason);

  return res
    .status(200)
    .json(new ApiResponse(200, { task }, "Task skipped"));
});

// ── GET /tasks/history ─────────────────────────────────────────
/**
 * Returns per-day task summaries for a date range.
 * Query: ?startDate=2026-07-01&endDate=2026-07-07
 * Used by the streak calendar on the dashboard.
 */
const getTaskHistory = asyncHandler(async (req, res) => {
  const userId              = req.user._id;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "startDate and endDate are required"));
  }

  const start = new Date(startDate);
  const end   = new Date(endDate);

  if (isNaN(start) || isNaN(end)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid date format. Use YYYY-MM-DD"));
  }

  if (end < start) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "endDate must be after startDate"));
  }

  const diffDays = (end - start) / 86400000;
  if (diffDays > 90) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Date range cannot exceed 90 days"));
  }

  const history = await taskService.getTaskHistory(userId, startDate, endDate);

  return res
    .status(200)
    .json(new ApiResponse(200, { history }, "Task history fetched successfully"));
});

module.exports = { getTodaysTasks, completeTask, skipTask, getTaskHistory };