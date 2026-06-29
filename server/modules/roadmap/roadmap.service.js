const AppError   = require('../../utils/appError')
const Roadmap    = require('../../models/roadmap.model')
const { getGeminiModel } = require('../../config/gemini')
const {
  SYSTEM_INSTRUCTION,
  buildRoadmapPrompt,
  buildRegeneratePrompt,
} = require('./roadmap.prompts')

// ─── Gemini Caller ─────────────────────────────────────────────────────────────

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

      if (is429 || isQuota) {
        throw new AppError(429, 'AI service is busy. Please wait and try again.')
      }

      if (err.statusCode) throw err
      throw new AppError(502, `AI service error: ${msg}`)
    }
  }
}

// ─── Validator ─────────────────────────────────────────────────────────────────

const validateAIRoadmap = (data) => {
  if (!Array.isArray(data.phases) || data.phases.length === 0) {
    throw new AppError(502, 'AI returned an invalid roadmap structure.')
  }

  for (const phase of data.phases) {
    if (!phase.title || !Array.isArray(phase.skills) || phase.skills.length === 0) {
      throw new AppError(502, 'AI returned a phase with missing title or skills.')
    }

    for (const skill of phase.skills) {
      if (!skill.name || typeof skill.name !== 'string') {
        throw new AppError(502, 'AI returned a skill with missing name.')
      }
      if (!Array.isArray(skill.dailyTasks) || skill.dailyTasks.length === 0) {
        throw new AppError(502, `AI returned skill "${skill.name}" with no daily tasks.`)
      }
    }
  }
}

// ─── Map AI Output → DB Shape ──────────────────────────────────────────────────

const mapPhases = (aiPhases, preservedSkills = {}) =>
  aiPhases.map((phase, idx) => ({
    title:       phase.title,
    order:       phase.order ?? idx + 1,
    description: phase.description || '',
    startDate:   phase.startDate ? new Date(phase.startDate) : null,
    endDate:     phase.endDate   ? new Date(phase.endDate)   : null,
    skills: (phase.skills || []).map((s) => {
      const key       = s.name.toLowerCase()
      const preserved = preservedSkills[key] || {}

      return {
        name:          s.name,
        description:   s.description  || '',
        estimatedDays: s.estimatedDays || 7,
        startDate:     s.startDate ? new Date(s.startDate) : null,
        endDate:       s.endDate   ? new Date(s.endDate)   : null,
        // Preserve completion if skill existed before (on regenerate)
        completed:     preserved.completed  ?? false,
        completedAt:   preserved.completedAt ?? null,
        dailyTasks: (s.dailyTasks || []).map((t, tIdx) => ({
          day:         t.day ?? tIdx + 1,
          title:       t.title       || `Day ${t.day ?? tIdx + 1} Task`,
          description: t.description || '',
          // Preserve task completion on regenerate
          completed:   preserved.tasks?.[t.day] ?? false,
          completedAt: preserved.taskDates?.[t.day] ?? null,
        })),
      }
    }),
  }))

// Build a lookup map of previous skill completion state for regeneration
const buildPreservedSkills = (existingPhases) => {
  const map = {}

  for (const phase of existingPhases) {
    for (const skill of phase.skills) {
      const key    = skill.name.toLowerCase()
      const tasks  = {}
      const dates  = {}

      for (const t of skill.dailyTasks || []) {
        tasks[t.day]  = t.completed
        dates[t.day]  = t.completedAt
      }

      map[key] = {
        completed:   skill.completed,
        completedAt: skill.completedAt,
        tasks,
        dates,
      }
    }
  }

  return map
}

// ─── Service Functions ─────────────────────────────────────────────────────────

const generateRoadmap = async (userId, { targetCareer, skillLevel, duration, interests, startDate }) => {
  const prompt  = buildRoadmapPrompt({ targetCareer, skillLevel, duration, interests, startDate })  
  const aiData  = await callGemini(prompt)
  
  validateAIRoadmap(aiData)

  const roadmap = await Roadmap.create({
    user: userId,
    targetCareer,
    skillLevel,
    duration,
    interests,
    summary:   aiData.summary   || '',
    startDate: aiData.startDate ? new Date(aiData.startDate) : new Date(),
    endDate:   aiData.endDate   ? new Date(aiData.endDate)   : null,
    phases:    mapPhases(aiData.phases),
  })

  return roadmap
}

const regenerateRoadmap = async (userId, roadmapId, { feedback }) => {
  const existing = await Roadmap.findOne({ _id: roadmapId, user: userId })
  if (!existing) throw new AppError(404, 'Roadmap not found')

  const prompt = buildRegeneratePrompt({
    targetCareer: existing.targetCareer,
    skillLevel:   existing.skillLevel,
    duration:     existing.duration,
    interests:    existing.interests,
    startDate:    existing.startDate?.toISOString().split('T')[0],
    feedback,
  })

  const aiData         = await callGemini(prompt)
  validateAIRoadmap(aiData)

  const preservedSkills = buildPreservedSkills(existing.phases)

  existing.summary   = aiData.summary   || existing.summary
  existing.startDate = aiData.startDate ? new Date(aiData.startDate) : existing.startDate
  existing.endDate   = aiData.endDate   ? new Date(aiData.endDate)   : existing.endDate
  existing.phases    = mapPhases(aiData.phases, preservedSkills)

  await existing.save()
  return existing
}

const getRoadmaps = async (userId) =>
  Roadmap.find({ user: userId, isActive: true })
    .select('targetCareer skillLevel duration summary startDate endDate createdAt')
    .sort({ createdAt: -1 })

const getRoadmapById = async (userId, roadmapId) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId })
  if (!roadmap) throw new AppError(404, 'Roadmap not found')
  return roadmap
}

const updateRoadmap = async (userId, roadmapId, updates) => {
  const roadmap = await Roadmap.findOneAndUpdate(
    { _id: roadmapId, user: userId },
    { $set: updates },
    { new: true, runValidators: true }
  )
  if (!roadmap) throw new AppError(404, 'Roadmap not found')
  return roadmap
}

const deleteRoadmap = async (userId, roadmapId) => {
  const roadmap = await Roadmap.findOneAndUpdate(
    { _id: roadmapId, user: userId },
    { isActive: false },
    { new: true }
  )
  if (!roadmap) throw new AppError(404, 'Roadmap not found')
  return roadmap
}

const updateSkillProgress = async (userId, roadmapId, phaseIndex, skillIndex, completed) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId })
  if (!roadmap) throw new AppError(404, 'Roadmap not found')

  const skill = roadmap.phases[phaseIndex]?.skills[skillIndex]
  if (!skill) throw new AppError(400, 'Invalid phase or skill index')

  skill.completed  = completed
  skill.completedAt = completed ? new Date() : null

  // Auto-complete all daily tasks when skill is marked complete
  if (completed) {
    skill.dailyTasks.forEach((t) => {
      t.completed  = true
      t.completedAt = t.completedAt || new Date()
    })
  }

  await roadmap.save()
  return roadmap
}

const updateTaskProgress = async (userId, roadmapId, phaseIndex, skillIndex, taskIndex, completed) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId })
  if (!roadmap) throw new AppError(404, 'Roadmap not found')

  const skill = roadmap.phases[phaseIndex]?.skills[skillIndex]
  if (!skill) throw new AppError(400, 'Invalid phase or skill index')

  const task = skill.dailyTasks[taskIndex]
  if (!task) throw new AppError(400, 'Invalid task index')

  task.completed  = completed
  task.completedAt = completed ? new Date() : null

  // Auto-complete the skill if all its tasks are now done
  const allDone = skill.dailyTasks.every((t) => t.completed)
  if (allDone && !skill.completed) {
    skill.completed  = true
    skill.completedAt = new Date()
  }

  // Auto-uncomplete skill if a task is unchecked
  if (!completed && skill.completed) {
    skill.completed  = false
    skill.completedAt = null
  }

  await roadmap.save()
  return roadmap
}

module.exports = {
  generateRoadmap,
  regenerateRoadmap,
  getRoadmaps,
  getRoadmapById,
  updateRoadmap,
  deleteRoadmap,
  updateSkillProgress,
  updateTaskProgress,
}