const AppError = require('../../utils/appError')
const Progress = require('../../models/progress.model')
const Roadmap = require('../../models/roadmap.model')

// Compute current streak: consecutive days (walking back from today)
// where streakMaintained === true, stopping at the first gap.
function calculateCurrentStreak(dailyTaskHistory) {
  if (!dailyTaskHistory || dailyTaskHistory.length === 0) return 0;

  // Sort descending by date so we can walk backward from most recent
  const sorted = [...dailyTaskHistory].sort((a, b) => b.date - a.date);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  for (const entry of sorted) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === cursor.getTime() && entry.streakMaintained) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (entryDate.getTime() === cursor.getTime()) {
      // Today (or the day being checked) exists but wasn't maintained — streak broken
      break;
    } else if (entryDate.getTime() < cursor.getTime()) {
      // There's a gap (missing day) — streak broken
      break;
    }
    // if entryDate > cursor, skip (shouldn't happen with correct data, but guards duplicates)
  }

  return streak;
}

function calculateLongestStreak(dailyTaskHistory) {
  if (!dailyTaskHistory || dailyTaskHistory.length === 0) return 0;

  const sorted = [...dailyTaskHistory].sort((a, b) => a.date - b.date);

  let longest = 0;
  let current = 0;
  let prevDate = null;

  for (const entry of sorted) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);

    if (!entry.streakMaintained) {
      current = 0;
      prevDate = entryDate;
      continue;
    }

    if (prevDate) {
      const dayDiff = Math.round((entryDate - prevDate) / (1000 * 60 * 60 * 24));
      current = dayDiff === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    prevDate = entryDate;
  }

  return longest;
}

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
  const records = await Progress.find({ userId })  

  const totalRoadmaps     = records.length
  const completedRoadmaps = records.filter((r) => r.percentage === 100).length
  const totalSkills       = records.reduce((sum, r) => sum + r.totalSkills, 0)
  const completedSkills   = records.reduce((sum, r) => sum + r.completedSkills, 0)
  const overallPercentage = totalSkills > 0
    ? Math.round((completedSkills / totalSkills) * 100)
    : 0

  // XP and streak: aggregate across all roadmaps' progress records
  const totalXp = records.reduce((sum, r) => sum + (r.totalXpEarned || 0), 0)

  // Merge all daily histories across roadmaps to compute a single account-wide streak
  const allHistory = records.flatMap((r) => r.dailyTaskHistory || [])
  const streak = calculateCurrentStreak(allHistory)
  const longestStreak = calculateLongestStreak(allHistory)

  return {
    totalXp,
    streak,
    longestStreak,
    totalRoadmaps,
    completedRoadmaps,
    totalSkills,
    completedSkills,
    overallPercentage,
  }
}

module.exports = { syncProgress, getAllProgress, getProgressByRoadmap, getSummary, calculateCurrentStreak, calculateLongestStreak }