const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

/**
 * User Model
 * Stores account info, career preferences, and learning settings.
 * Passwords are hashed via pre-save hook — never store plain text.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
    },

    // ── Career Profile ─────────────────────────────────────────
    careerGoal: {
      type: String,
      trim: true,
      maxlength: [200, "Career goal cannot exceed 200 characters"],
      default: null,
    },

    currentSkillLevel: {
      type: String,
      enum: {
        values: ["Beginner", "Intermediate", "Advanced"],
        message: "Skill level must be Beginner, Intermediate, or Advanced",
      },
      default: "Beginner",
    },

    interests: {
      type: [String],
      default: [],
    },

    // ── Learning Preferences ───────────────────────────────────
    dailyStudyHours: {
      type: Number,
      min: [0.5, "Daily study hours must be at least 0.5"],
      max: [16, "Daily study hours cannot exceed 16"],
      default: 1,
    },

    preferredResourceTypes: {
      type: [String],
      enum: ["video", "article", "course", "documentation"],
      default: ["video", "article"],
    },

    // ── Gamification ───────────────────────────────────────────
    xpTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastActiveDate: {
      type: Date,
      default: null,
    },

    // ── Account Status ─────────────────────────────────────────
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Password Reset ─────────────────────────────────────────
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,   // never returned in API responses
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

// ── Virtual: active roadmaps count ────────────────────────────
userSchema.virtual("roadmaps", {
  ref: "Roadmap",
  localField: "_id",
  foreignField: "userId",
  count: true,
});

// ── Pre-save: hash password ────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// ── Method: verify password ────────────────────────────────────
userSchema.methods.verifyPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Method: update streak ──────────────────────────────────────
userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastActiveDate) {
    this.currentStreak = 1;
  } else {
    const last = new Date(this.lastActiveDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / 86400000);

    if (diffDays === 1) {
      this.currentStreak += 1;
    } else if (diffDays > 1) {
      this.currentStreak = 1; // Reset streak on missed day
    }
    // diffDays === 0 means already updated today — no change
  }

  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }

  this.lastActiveDate = today;
};

// ── Method: add XP ─────────────────────────────────────────────
userSchema.methods.addXP = function (amount) {
  this.xpTotal = (this.xpTotal || 0) + amount;
};

// ── Static: find active users ──────────────────────────────────
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

module.exports = mongoose.model("User", userSchema);
