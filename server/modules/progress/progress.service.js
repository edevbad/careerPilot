const AppError = require('../../utils/appError')
const Progress = require('../../models/progress.model')
const Roadmap = require('../../models/roadmap.model')

// Recalculate and upsert progress for a roadmap
const syncProgress = async (userId, roadmapId) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId })
  if (!roadmap) throw new AppError(404, 'Roadmap not found')

  const allSkills = roadmap.phases.flatMap((p) => p.skills)
  const totalSkills = allSkills.length
  const completedSkills = allSkills.filter((s) => s.completed).length
  const percentage = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0

  const progress = await Progress.findOneAndUpdate(
    { user: userId, roadmap: roadmapId },
    { totalSkills, completedSkills, percentage, lastUpdated: new Date() },
    { upsert: true, new: true }
  )

  return progress
}

const getAllProgress = async (userId) => {
  return Progress.find({ user: userId }).populate('roadmap', 'targetCareer skillLevel')
}

const getProgressByRoadmap = async (userId, roadmapId) => {
  const progress = await Progress.findOne({ user: userId, roadmap: roadmapId })
    .populate('roadmap', 'targetCareer skillLevel phases')
  if (!progress) throw new AppError(404, 'Progress record not found')
  return progress
}

const getSummary = async (userId) => {
  const records = await Progress.find({ user: userId })

  const totalRoadmaps     = records.length
  const completedRoadmaps = records.filter((r) => r.percentage === 100).length
  const totalSkills       = records.reduce((sum, r) => sum + r.totalSkills, 0)
  const completedSkills   = records.reduce((sum, r) => sum + r.completedSkills, 0)
  const overallPercentage = totalSkills > 0
    ? Math.round((completedSkills / totalSkills) * 100)
    : 0

  return {
    totalRoadmaps,
    completedRoadmaps,
    totalSkills,
    completedSkills,
    overallPercentage,
  }
}

module.exports = { syncProgress, getAllProgress, getProgressByRoadmap, getSummary }