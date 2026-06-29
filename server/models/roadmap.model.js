const mongoose = require('mongoose')

// ─── Daily Task ────────────────────────────────────────────────────────────────
const dailyTaskSchema = new mongoose.Schema({
  day:         { type: Number, required: true },        // 1–7
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
})

// ─── Skill ─────────────────────────────────────────────────────────────────────
const skillSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  estimatedDays:   { type: Number, default: 1 },
  startDate:       { type: Date, default: null },
  endDate:         { type: Date, default: null },
  completed:       { type: Boolean, default: false },
  completedAt:     { type: Date, default: null },
  dailyTasks:      [dailyTaskSchema],
})

// ─── Phase ─────────────────────────────────────────────────────────────────────
const phaseSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  order:       { type: Number, required: true },
  description: { type: String, default: '' },
  startDate:   { type: Date, default: null },
  endDate:     { type: Date, default: null },
  skills:      [skillSchema],
})

// ─── Roadmap ───────────────────────────────────────────────────────────────────
const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    targetCareer: {
      type:     String,
      required: [true, 'Target career is required'],
      trim:     true,
    },
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    duration:  { type: String, required: true },
    interests: { type: String, default: '' },
    summary:   { type: String, default: '' },

    // Timeline anchors
    startDate: { type: Date, default: null },
    endDate:   { type: Date, default: null },

    phases:   [phaseSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Roadmap', roadmapSchema)