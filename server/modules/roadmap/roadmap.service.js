const AppError = require('../../utils/appError')
const Roadmap  = require('../../models/roadmap.model')
const Progress = require('../../models/progress.model')
const {
  SYSTEM_INSTRUCTION,
  buildRoadmapPrompt,
  buildRegeneratePrompt,
} = require('./roadmap.prompts')
const { getGeminiModel } = require('../../config/gemini')

// ─── Gemini Caller (unchanged) ──────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const parseRetryDelay = (msg, defaultMs = 15000) => {
  const match = msg?.match(/retryDelay[^0-9]*(\d+)/)
  return match ? parseInt(match[1], 10) * 1000 : defaultMs
}

const callGemini = async (prompt, maxRetries = 2) => {
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      const model  = getGeminiModel()
      const result = await model.generateContent({
        systemInstruction: SYSTEM_INSTRUCTION,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })

      const raw = result.response.text()
      if (!raw?.trim()) throw new AppError(502, 'AI returned an empty response.')

      const cleaned = raw.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      try {
        return JSON.parse(cleaned)
      } catch {
        console.error('Unparseable Gemini response:', raw)
        throw new AppError(502, 'AI returned malformed data. Please try again.')
      }

    } catch (err) {
      const msg     = err.message || ''
      const is429   = msg.includes('429') || msg.includes('Too Many Requests')
      const isQuota = msg.includes('quota')

      if ((is429 || isQuota) && attempt < maxRetries) {
        const delay = parseRetryDelay(msg, 20000)
        console.warn(`Gemini rate limit. Retrying in ${delay / 1000}s... (attempt ${attempt + 1})`)
        await sleep(delay)
        attempt++
        continue
      }

      if (isQuota && msg.includes('limit: 0')) {
        throw new AppError(503, 'AI daily quota reached. Please try again tomorrow.')
      }

      if (is429 || isQuota) throw new AppError(429, 'AI service is busy. Please wait and try again.')
      if (err.statusCode) throw err
      throw new AppError(502, `AI service error: ${msg}`)
    }
  }
}

// ─── Validator ──────────────────────────────────────────────────────────────

const validateAIRoadmap = (data) => {
  if (!Array.isArray(data.phases) || data.phases.length === 0) {
    throw new AppError(502, 'AI returned an invalid roadmap structure.')
  }

  for (const phase of data.phases) {
    if (!phase.title) {
      throw new AppError(502, 'AI returned a phase with a missing title.')
    }
    if (!phase.difficulty || !['Beginner', 'Intermediate', 'Advanced'].includes(phase.difficulty)) {
      throw new AppError(502, `AI returned an invalid difficulty for phase "${phase.title}".`)
    }
    if (!Array.isArray(phase.learningObjectives) || phase.learningObjectives.length === 0) {
      throw new AppError(502, `AI returned phase "${phase.title}" with no learning objectives.`)
    }
    if (!Array.isArray(phase.subTopics) || phase.subTopics.length === 0) {
      throw new AppError(502, `AI returned phase "${phase.title}" with no sub-topics.`)
    }
  }
}

// ─── Map AI output → DB shape ────────────────────────────────────────────────
// Preserves status/unlockedAt/completedAt for phases that already existed (regenerate)

const mapPhases = (aiPhases, preservedPhases = {}) =>
  aiPhases.map((phase, idx) => {
    const phaseNum  = phase.phaseNumber ?? idx + 1
    const preserved = preservedPhases[phaseNum] || {}

    return {
      phaseNumber:      phaseNum,
      title:            phase.title,
      summary:          phase.summary          || '',
      difficulty:       phase.difficulty,
      estimatedWeeks:   phase.estimatedWeeks   ?? 2,
      prerequisites:    phase.prerequisites    ?? (phaseNum > 1 ? [phaseNum - 1] : []),
      learningObjectives: (phase.learningObjectives || []).filter(Boolean),
      subTopics: (phase.subTopics || []).map((s, sIdx) => ({
        order:       s.order       ?? sIdx + 1,
        title:       s.title,
        description: s.description || '',
      })),
      // Preserve phase lifecycle fields on regenerate
      status:               preserved.status      ?? 'locked',
      unlockedAt:           preserved.unlockedAt  ?? null,
      completedAt:          preserved.completedAt ?? null,
      skillCompletionPercent: preserved.skillCompletionPercent ?? 0,
      quizRequired:         preserved.quizRequired         ?? true,
      quizPassingScore:     preserved.quizPassingScore     ?? 70,
    }
  })

// Build a lookup of existing phase state keyed by phaseNumber (for regenerate)
const buildPreservedPhases = (existingPhases) => {
  const map = {}
  for (const phase of existingPhases) {
    map[phase.phaseNumber] = {
      status:                 phase.status,
      unlockedAt:             phase.unlockedAt,
      completedAt:            phase.completedAt,
      skillCompletionPercent: phase.skillCompletionPercent,
      quizRequired:           phase.quizRequired,
      quizPassingScore:       phase.quizPassingScore,
    }
  }
  return map
}

// ─── Service Functions ───────────────────────────────────────────────────────

const generateRoadmap = async (userId, { targetCareer, skillLevel, duration, interests, startDate }) => {
  const prompt = buildRoadmapPrompt({ targetCareer, skillLevel, duration, interests, startDate })
  const aiData = await callGemini(prompt)
  validateAIRoadmap(aiData)

  const phases = mapPhases(aiData.phases)
  // Phase 1 is always unlocked immediately — the pre-save hook also does this
  // but we set it here explicitly so the returned object is correct before save
  if (phases.length > 0) {
    phases[0].status     = 'active'
    phases[0].unlockedAt = new Date()
  }

  const roadmap = await Roadmap.create({
    userId,
    targetCareer,
    skillLevel,
    summary:  aiData.summary || '',
    phases,
  })

  // Seed a Progress document so the daily task and quiz services
  // have somewhere to write results immediately after creation
  await Progress.create({
    userId,
    roadmapId: roadmap._id,
    phaseProgress: roadmap.phases.map((p) => ({
      phaseNumber:       p.phaseNumber,
      skills:            [],
      completionPercent: 0,
      latestQuizScore:   null,
      quizPassed:        false,
    })),
  })

  return roadmap
}

// ────────────────────────────────────────────────────────────────────────────

const regenerateRoadmap = async (userId, roadmapId, { feedback }) => {
  const existing = await Roadmap.findOne({ _id: roadmapId, userId })
  if (!existing) throw new AppError(404, 'Roadmap not found')

  // Tell the AI which phases are already completed so it doesn't touch them
  const completedPhaseNumbers = existing.phases
    .filter((p) => p.status === 'completed')
    .map((p) => p.phaseNumber)

  const prompt = buildRegeneratePrompt({
    targetCareer:          existing.targetCareer,
    skillLevel:            existing.skillLevel,
    duration:              existing.duration,
    interests:             existing.interests,
    startDate:             existing.startDate?.toISOString().split('T')[0],
    feedback,
    completedPhaseNumbers,
  })

  const aiData = await callGemini(prompt)
  validateAIRoadmap(aiData)

  // Preserve lifecycle state for all existing phases
  const preservedPhases = buildPreservedPhases(existing.phases)
  const newPhases       = mapPhases(aiData.phases, preservedPhases)

  // Ensure phase 1 is still active if it wasn't completed
  if (newPhases.length > 0 && newPhases[0].status === 'locked') {
    newPhases[0].status     = 'active'
    newPhases[0].unlockedAt = existing.phases[0]?.unlockedAt ?? new Date()
  }

  existing.summary = aiData.summary || existing.summary
  existing.phases  = newPhases

  await existing.save()

  // Rebuild phaseProgress entries in Progress for any new phases
  // (completed phases keep their existing progress entries)
  const progress = await Progress.findOne({ userId, roadmapId })
  if (progress) {
    const existingPhaseNums = new Set(progress.phaseProgress.map((p) => p.phaseNumber))

    for (const phase of newPhases) {
      if (!existingPhaseNums.has(phase.phaseNumber)) {
        progress.phaseProgress.push({
          phaseNumber:       phase.phaseNumber,
          skills:            [],
          completionPercent: 0,
          latestQuizScore:   null,
          quizPassed:        false,
        })
      }
    }

    await progress.save()
  }

  return existing
}

// ────────────────────────────────────────────────────────────────────────────

const getRoadmaps = async (userId) =>
  Roadmap.find({ userId, status: { $ne: 'archived' } })
    .select('targetCareer skillLevel summary status completionPercent activePhaseNumber totalEstimatedWeeks createdAt')
    .sort({ createdAt: -1 })

// ────────────────────────────────────────────────────────────────────────────

const getRoadmapById = async (userId, roadmapId) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId })
  if (!roadmap) throw new AppError(404, 'Roadmap not found')
  return roadmap
}

// ────────────────────────────────────────────────────────────────────────────

const updateRoadmap = async (userId, roadmapId, updates) => {
  // Prevent altering fields that are managed by the system
  const PROTECTED = ['userId', 'phases', 'status', 'completionPercent', 'activePhaseNumber', 'generatedBy']
  for (const key of PROTECTED) delete updates[key]

  const roadmap = await Roadmap.findOneAndUpdate(
    { _id: roadmapId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  )
  if (!roadmap) throw new AppError(404, 'Roadmap not found')
  return roadmap
}

// ────────────────────────────────────────────────────────────────────────────

const deleteRoadmap = async (userId, roadmapId) => {
  const roadmap = await Roadmap.findOneAndUpdate(
    { _id: roadmapId, userId },
    { status: 'archived' },
    { new: true }
  )
  if (!roadmap) throw new AppError(404, 'Roadmap not found')

  // Cancel any pending daily tasks for this roadmap
  // (don't delete — they are part of the user's history)
  const DailyTask = require('../../models/DailyTask')
  await DailyTask.updateMany(
    { userId, roadmapId, status: 'pending' },
    { status: 'skipped', skipReason: 'other' }
  )

  return roadmap
}

// ────────────────────────────────────────────────────────────────────────────
// Phase skill completion — updates the phase's skillCompletionPercent
// The caller passes how many skills are done out of total for that phase.
// This is called by the frontend skill checklist (individual skill toggles
// still live in the daily task service for task-level completion).

const updatePhaseSkillCompletion = async (userId, roadmapId, phaseNumber, { completedCount, totalCount }) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId })
  if (!roadmap) throw new AppError(404, 'Roadmap not found')

  const phase = roadmap.phases.find((p) => p.phaseNumber === phaseNumber)
  if (!phase) throw new AppError(400, `Phase ${phaseNumber} not found on this roadmap`)

  if (phase.status === 'locked') {
    throw new AppError(400, 'Cannot update progress on a locked phase')
  }

  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  phase.skillCompletionPercent = percent

  // Auto-mark phase as completed if all skills done AND quiz not required
  if (percent === 100 && !phase.quizRequired) {
    roadmap.unlockNextPhase()
  }

  // Sync into Progress collection
  const progress = await Progress.findOne({ userId, roadmapId })
  if (progress) {
    const phaseEntry = progress.phaseProgress.find((p) => p.phaseNumber === phaseNumber)
    if (phaseEntry) {
      phaseEntry.completionPercent = percent
    }
    await progress.save()
  }

  await roadmap.save()
  return roadmap
}

// ────────────────────────────────────────────────────────────────────────────

module.exports = {
  generateRoadmap,
  regenerateRoadmap,
  getRoadmaps,
  getRoadmapById,
  updateRoadmap,
  deleteRoadmap,
  updatePhaseSkillCompletion,  // replaces updateSkillProgress + updateTaskProgress
}