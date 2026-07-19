const mongoose = require("mongoose");

/**
 * XP rewards per task type — centralised here so they can be
 * imported by the task-generation service and the completion handler.
 */
const XP_REWARDS = Object.freeze({
  reading: 10,
  coding: 25,
  video: 15,
  "mini-project": 50,
});

/**
 * DailyTask Model
 * One document per task per user per day.
 * Tasks are generated nightly by the scheduler cron job and
 * expire at midnight of the following day.
 */
const dailyTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roadmap",
      required: [true, "Roadmap ID is required"],
    },

    // The phase this task targets
    phaseNumber: {
      type: Number,
      required: [true, "Phase number is required"],
    },

    // ── Task Content ───────────────────────────────────────────
    taskType: {
      type: String,
      enum: {
        values: ["reading", "coding", "video", "mini-project"],
        message: "Task type must be reading, coding, video, or mini-project",
      },
      required: [true, "Task type is required"],
    },

    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Task title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
      maxlength: [1000, "Task description cannot exceed 1000 characters"],
    },

    // Optional URL for reading/video tasks
    resourceUrl: {
      type: String,
      trim: true,
      default: null,
    },

    // Estimated minutes to complete
    estimatedMinutes: {
      type: Number,
      min: 5,
      max: 180,
      default: 30,
    },

    xpReward: {
      type: Number,
      required: true,
      min: 0,
    },

    // ── Scheduling ─────────────────────────────────────────────
    assignedDate: {
      type: Date,
      required: [true, "Assigned date is required"],
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true, // Used by the TTL cleanup cron
    },

    // ── Status ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "skipped"],
        message: "Status must be pending, completed, or skipped",
      },
      default: "pending",
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Why the user skipped (optional feedback for AI re-training)
    skipReason: {
      type: String,
      enum: ["too-easy", "too-hard", "not-relevant", "no-time", "other", null],
      default: null,
    },

    // Deprioritise in future generation after N skips
    skipCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Was this task AI-generated or seeded from the task bank?
    generatedBy: {
      type: String,
      enum: ["ai", "seed"],
      default: "ai",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound indexes ───────────────────────────────────────────
dailyTaskSchema.index({ userId: 1, assignedDate: 1 });
dailyTaskSchema.index({ userId: 1, status: 1 });
dailyTaskSchema.index({ roadmapId: 1, phaseNumber: 1 });

// ── Virtual: is this task overdue? ────────────────────────────
dailyTaskSchema.virtual("isExpired").get(function () {
  return this.status === "pending" && new Date() > this.expiresAt;
});

// ── Static: get today's tasks for a user ──────────────────────
dailyTaskSchema.statics.getTodayForUser = function (userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return this.find({
    userId,
    assignedDate: { $gte: start, $lte: end },
  }).sort({ taskType: 1 });
};

// ── Static: daily summary stats for a user/date ───────────────
dailyTaskSchema.statics.getDaySummary = async function (userId, date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const tasks = await this.find({
    userId,
    assignedDate: { $gte: start, $lte: end },
  });

  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    skipped: tasks.filter((t) => t.status === "skipped").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    xpEarned: tasks
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.xpReward, 0),
  };
};

// ── Method: complete this task ─────────────────────────────────
dailyTaskSchema.methods.complete = function () {
  if (this.status !== "pending") return false;
  this.status = "completed";
  this.completedAt = new Date();
  return true;
};

// ── Method: skip this task ─────────────────────────────────────
dailyTaskSchema.methods.skip = function (reason = null) {
  if (this.status !== "pending") return false;
  this.status = "skipped";
  this.skipReason = reason;
  this.skipCount += 1;
  return true;
};

// ── Pre-validate: set xpReward from type if not provided ──────
dailyTaskSchema.pre("validate", function () {
  if (!this.xpReward && this.taskType) {
    this.xpReward = XP_REWARDS[this.taskType] ?? 10;
  }
  // expiresAt = end of assignedDate
  if (this.assignedDate && !this.expiresAt) {
    const exp = new Date(this.assignedDate);
    exp.setHours(23, 59, 59, 999);
    this.expiresAt = exp;
  }
});

module.exports = mongoose.model("DailyTask", dailyTaskSchema);
module.exports.XP_REWARDS = XP_REWARDS;
