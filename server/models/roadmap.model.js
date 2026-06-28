const mongoose = require('mongoose')

const skillSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  completed: { type: Boolean, default: false },
})

const phaseSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  order:       { type: Number, required: true },
  description: { type: String, default: '' },
  skills:      [skillSchema],
})

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetCareer: {
      type: String,
      required: [true, 'Target career is required'],
      trim: true,
    },
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    interests: {
      type: String,
      default: '',
    },
    summary: {
      type: String,   // AI-generated roadmap overview
      default: '',
    },
    phases:   [phaseSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Roadmap', roadmapSchema)