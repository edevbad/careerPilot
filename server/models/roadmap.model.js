const mongoose = require("mongoose");

/**
 * Sub-schema: a single sub-topic within a phase
 */
const subTopicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

/**
 * Sub-schema: a single phase within the roadmap
 * Each phase is a discrete learning unit (e.g., "Phase 2: Node.js & Express")
 */
const phaseSchema = new mongoose.Schema(
  {
    phaseNumber: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      required: [true, "Phase title is required"],
      trim: true,
    },

    summary: {
      type: String,
      trim: true,
      maxlength: [600, "Phase summary cannot exceed 600 characters"],
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },

    // Estimated weeks to complete (adjusted per user's dailyStudyHours)
    estimatedWeeks: {
      type: Number,
      min: 1,
      default: 2,
    },

    subTopics: {
      type: [subTopicSchema],
      default: [],
    },

    // What the user will be able to do after this phase
    learningObjectives: {
      type: [String],
      default: [],
    },

    // IDs of phases that must be completed first
    prerequisites: {
      type: [Number], // phaseNumbers
      default: [],
    },

    // Quiz must be passed to unlock the next phase
    quizRequired: {
      type: Boolean,
      default: true,
    },

    quizPassingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },

    // ── Status ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["locked", "active", "completed"],
      default: "locked",
    },

    unlockedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    skillCompletionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    resources: {
      type: [{
        title: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        type: { type: String, enum: ['video', 'article', 'course', 'documentation'], required: true },
        platform: { type: String, trim: true, default: '' },
        isBookmarked: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
      }],
      default: [],
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

/**
 * Roadmap Model
 * One roadmap per user per target career.
 * Contains all phases with their detailed metadata.
 */
const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    targetCareer: {
      type: String,
      required: [true, "Target career is required"],
      trim: true,
      maxlength: [150, "Target career cannot exceed 150 characters"],
    },

    // The overall learning level this roadmap is tailored for
    skillLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },

    totalEstimatedWeeks: {
      type: Number,
      min: 1,
    },

    phases: {
      type: [phaseSchema],
      validate: {
        validator: (phases) => phases.length >= 1,
        message: "A roadmap must have at least one phase",
      },
    },

    // ── Status ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "completed", "paused", "archived"],
      default: "active",
      index: true,
    },

    completionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Which phase the user is currently working on (phaseNumber)
    activePhaseNumber: {
      type: Number,
      default: 1,
    },

    // Was this roadmap AI-generated or manually created?
    generatedBy: {
      type: String,
      enum: ["ai", "manual"],
      default: "ai",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────
roadmapSchema.index({ userId: 1, status: 1 });
roadmapSchema.index({ userId: 1, targetCareer: 1 });

// ── Virtual: active phase object ───────────────────────────────
roadmapSchema.virtual("activePhase").get(function () {
  if (!Array.isArray(this.phases)) return null;

  return this.phases.find((p) => p.phaseNumber === this.activePhaseNumber) || null;
});

// ── Method: recalculate overall completion % ───────────────────
roadmapSchema.methods.recalculateCompletion = function () {
  if (!this.phases.length) {
    this.completionPercent = 0;
    return;
  }
  const completed = this.phases.filter((p) => p.status === "completed").length;
  this.completionPercent = Math.round((completed / this.phases.length) * 100);

  if (this.completionPercent === 100) {
    this.status = "completed";
  }
};

// ── Method: unlock next phase ──────────────────────────────────
roadmapSchema.methods.unlockNextPhase = function () {
  const current = this.phases.find((p) => p.phaseNumber === this.activePhaseNumber);
  const next = this.phases.find((p) => p.phaseNumber === this.activePhaseNumber + 1);

  if (current) current.status = "completed";
  if (current) current.completedAt = new Date();

  if (next) {
    next.status = "active";
    next.unlockedAt = new Date();
    this.activePhaseNumber = next.phaseNumber;
  }

  this.recalculateCompletion();
};

// ── Pre-save: compute totalEstimatedWeeks & first phase unlock ─
roadmapSchema.pre("save", function () {
  if (this.isNew) {
    // Unlock phase 1 on creation
    if (this.phases.length > 0) {
      this.phases[0].status = "active";
      this.phases[0].unlockedAt = new Date();
    }
  }

  this.totalEstimatedWeeks = this.phases.reduce(
    (sum, p) => sum + (p.estimatedWeeks || 0),
    0
  );
});

module.exports = mongoose.model("Roadmap", roadmapSchema);
