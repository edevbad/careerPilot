const mongoose = require("mongoose");

/**
 * Sub-schema: user's answer to a single quiz question
 */
const answerSchema = new mongoose.Schema(
  {
    // References a question in the Laravel quiz_questions table
    questionId: {
      type: Number,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    userAnswer: {
      type: String,
      default: null, // null = question was skipped/unanswered
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    // Explanation shown to user post-submission
    explanation: {
      type: String,
      default: "",
    },
    questionType: {
      type: String,
      enum: ["mcq", "true-false", "code-review"],
      required: true,
    },
  },
  { _id: false }
);

/**
 * QuizResult Model
 * One document per quiz attempt (a user can have multiple attempts per phase).
 * Enforces cooldown logic and tracks pass/fail history.
 */
const quizResultSchema = new mongoose.Schema(
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

    // Which roadmap phase this quiz is for
    phaseNumber: {
      type: Number,
      required: [true, "Phase number is required"],
    },

    // ── Attempt Tracking ───────────────────────────────────────
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // ── Scoring ────────────────────────────────────────────────
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },

    score: {
      type: Number, // Percentage 0–100
      required: true,
      min: 0,
      max: 100,
    },

    passingScore: {
      type: Number,
      required: true,
      default: 70,
    },

    passed: {
      type: Boolean,
      required: true,
    },

    // ── Answer Detail ──────────────────────────────────────────
    answers: {
      type: [answerSchema],
      default: [],
    },

    // ── Timing ────────────────────────────────────────────────
    startedAt: {
      type: Date,
      required: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Time taken in seconds
    durationSeconds: {
      type: Number,
      default: null,
      min: 0,
    },

    // ── Cooldown ───────────────────────────────────────────────
    // If failed, the user cannot retake until this date
    retakeAvailableAt: {
      type: Date,
      default: null,
    },

    // Study suggestions shown to user after a failed attempt
    studySuggestions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────
quizResultSchema.index({ userId: 1, roadmapId: 1, phaseNumber: 1 });
quizResultSchema.index({ userId: 1, passed: 1 });

// ── Virtual: time taken as human-readable string ───────────────
quizResultSchema.virtual("durationFormatted").get(function () {
  if (!this.durationSeconds) return null;
  const m = Math.floor(this.durationSeconds / 60);
  const s = this.durationSeconds % 60;
  return `${m}m ${s}s`;
});

// ── Virtual: can retake now? ───────────────────────────────────
quizResultSchema.virtual("canRetake").get(function () {
  if (this.passed) return false;
  if (!this.retakeAvailableAt) return true;
  return new Date() >= this.retakeAvailableAt;
});

// ── Static: latest attempt for a user/roadmap/phase ───────────
quizResultSchema.statics.getLatestAttempt = function (userId, roadmapId, phaseNumber) {
  return this.findOne({ userId, roadmapId, phaseNumber })
    .sort({ attemptNumber: -1 })
    .limit(1);
};

// ── Static: count attempts for a user/phase ───────────────────
quizResultSchema.statics.countAttempts = function (userId, roadmapId, phaseNumber) {
  return this.countDocuments({ userId, roadmapId, phaseNumber });
};

// ── Static: check if user passed a phase ──────────────────────
quizResultSchema.statics.hasPassed = async function (userId, roadmapId, phaseNumber) {
  const result = await this.findOne({ userId, roadmapId, phaseNumber, passed: true });
  return !!result;
};

// ── Pre-save: compute derived fields ──────────────────────────
quizResultSchema.pre("save", function (next) {
  // Score
  if (this.totalQuestions > 0) {
    this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }

  // Pass/fail
  this.passed = this.score >= this.passingScore;

  // Duration
  if (this.startedAt && this.completedAt) {
    this.durationSeconds = Math.round(
      (this.completedAt - this.startedAt) / 1000
    );
  }

  // 24-hour cooldown on failure
  if (!this.passed && !this.retakeAvailableAt) {
    const cooldown = new Date();
    cooldown.setHours(cooldown.getHours() + 24);
    this.retakeAvailableAt = cooldown;
  }

  next();
});

module.exports = mongoose.model("QuizResult", quizResultSchema);
