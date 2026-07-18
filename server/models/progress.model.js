const mongoose = require("mongoose");

/**
 * Sub-schema: individual skill completion record within a phase
 */
const skillEntrySchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    // References a skill ID from the Laravel skills table
    laravelSkillId: {
      type: Number,
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

/**
 * Progress Model
 * One Progress document per user per roadmap.
 * Tracks skill completion, daily task history, and quiz results per phase.
 */
const progressSchema = new mongoose.Schema(
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
      index: true,
    },

    // ── Per-Phase Skill Tracking ───────────────────────────────
    phaseProgress: [
      {
        phaseNumber: {
          type: Number,
          required: true,
        },
        skills: {
          type: [skillEntrySchema],
          default: [],
        },
        completionPercent: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        // Snapshot of the latest quiz attempt for this phase
        latestQuizScore: {
          type: Number,
          default: null,
        },
        quizPassed: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ── Overall Stats ──────────────────────────────────────────
    overallCompletionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    totalSkillsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalXpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Daily Task History (summary per day) ───────────────────
    // Detailed task records live in the DailyTask collection.
    // This array holds one summary entry per calendar day.
    dailyTaskHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        totalTasks: {
          type: Number,
          default: 0,
        },
        completedTasks: {
          type: Number,
          default: 0,
        },
        skippedTasks: {
          type: Number,
          default: 0,
        },
        xpEarned: {
          type: Number,
          default: 0,
        },
        streakMaintained: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ── Bookmarked Resources ───────────────────────────────────
    bookmarkedResourceIds: {
      type: [Number], // Laravel resource IDs
      default: [],
    },

    completedResourceIds: {
      type: [Number], // Laravel resource IDs
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound index: one progress doc per user per roadmap ──────
progressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

// ── Method: mark a skill complete ─────────────────────────────
progressSchema.methods.completeSkill = function (phaseNumber, skillName) {
  const phase = this.phaseProgress.find((p) => p.phaseNumber === phaseNumber);
  if (!phase) return false;

  const skill = phase.skills.find((s) => s.skillName === skillName);
  if (!skill || skill.isCompleted) return false;

  skill.isCompleted = true;
  skill.completedAt = new Date();
  this.totalSkillsCompleted += 1;

  // Recalculate phase completion %
  const total = phase.skills.length;
  const done = phase.skills.filter((s) => s.isCompleted).length;
  phase.completionPercent = total ? Math.round((done / total) * 100) : 0;

  this._recalculateOverall();
  return true;
};

// ── Method: record daily task summary ─────────────────────────
progressSchema.methods.recordDaySummary = function (date, { total, completed, skipped, xp, streakMaintained }) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const existing = this.dailyTaskHistory.find(
    (d) => d.date.toDateString() === day.toDateString()
  );

  if (existing) {
    existing.completedTasks = completed;
    existing.skippedTasks = skipped;
    existing.xpEarned = xp;
    existing.streakMaintained = streakMaintained;
  } else {
    this.dailyTaskHistory.push({
      date: day,
      totalTasks: total,
      completedTasks: completed,
      skippedTasks: skipped,
      xpEarned: xp,
      streakMaintained,
    });
  }

  this.totalXpEarned += xp;
};

// ── Private: recalculate overall % from all phases ─────────────
progressSchema.methods._recalculateOverall = function () {
  if (!this.phaseProgress.length) {
    this.overallCompletionPercent = 0;
    return;
  }
  const avg =
    this.phaseProgress.reduce((sum, p) => sum + p.completionPercent, 0) /
    this.phaseProgress.length;
  this.overallCompletionPercent = Math.round(avg);
};

module.exports = mongoose.model("Progress", progressSchema);
