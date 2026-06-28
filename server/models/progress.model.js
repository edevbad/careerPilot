const mongoose = require('mongoose')

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: true,
    },
    totalSkills:     { type: Number, default: 0 },
    completedSkills: { type: Number, default: 0 },
    percentage:      { type: Number, default: 0 },
    lastUpdated:     { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Ensure one progress doc per user+roadmap
progressSchema.index({ user: 1, roadmap: 1 }, { unique: true })

module.exports = mongoose.model('Progress', progressSchema)