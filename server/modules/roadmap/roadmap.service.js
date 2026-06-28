const AppError = require('../../utils/appError')
const Roadmap = require('../../models/roadmap.model')
const { getGeminiModel } = require('../../config/gemini')
const {
  SYSTEM_INSTRUCTION,
  buildRoadmapPrompt,
  buildRegeneratePrompt,
} = require('./roadmap.prompts')

// ─── Retry Helper ──────────────────────────────────────────────────────────────

/**
 * Waits for a given number of milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Extracts the retry delay in ms from a Gemini 429 error message.
 * Falls back to `defaultMs` if not found.
 */
const parseRetryDelay = (errorMessage, defaultMs = 15000) => {
  const match = errorMessage?.match(/retryDelay[^0-9]*(\d+)/)
  if (match) return parseInt(match[1], 10) * 1000
  return defaultMs
}

// ─── Gemini Caller ─────────────────────────────────────────────────────────────

/**
 * Sends a prompt to Gemini with automatic retry on 429.
 * Retries up to `maxRetries` times with the delay Gemini specifies.
 */
const callGemini = async (prompt, maxRetries = 2) => {
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      const model = getGeminiModel()

      const result = await model.generateContent({
        systemInstruction: SYSTEM_INSTRUCTION,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })

      const raw = result.response.text()

      if (!raw || raw.trim() === '') {
        throw new AppError(502, 'AI service returned an empty response. Please try again.')
      }

      // Strip accidental markdown fences
      const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      let parsed
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        console.error('Gemini raw response (unparseable):', raw)
        throw new AppError(502, 'AI service returned malformed data. Please try again.')
      }

      return parsed

    } catch (err) {
      const message = err.message || ''
      const is429   = message.includes('429') || message.includes('Too Many Requests')
      const isQuota = message.includes('quota')

      // If it's a quota/rate-limit error and we have retries left — wait and retry
      if ((is429 || isQuota) && attempt < maxRetries) {
        const delay = parseRetryDelay(message, 20000)
        console.warn(
          `Gemini rate limit hit. Retrying in ${delay / 1000}s... ` +
          `(attempt ${attempt + 1} of ${maxRetries})`
        )
        await sleep(delay)
        attempt++
        continue
      }

      // Daily quota exhausted — no point retrying
      if (isQuota && message.includes('limit: 0')) {
        throw new AppError(
          503,
          'The AI service daily quota has been reached. Please try again tomorrow or upgrade your Gemini plan.'
        )
      }

      // Rate limit but out of retries
      if (is429 || isQuota) {
        throw new AppError(
          429,
          'The AI service is busy. Please wait a moment and try again.'
        )
      }

      // Any other error — rethrow as-is (AppError or unknown)
      if (err.statusCode) throw err
      throw new AppError(502, `AI service error: ${message}`)
    }
  }
}


/**
 * Validates the AI-generated roadmap shape before saving to DB.
 * Prevents saving garbage data if the model drifts from the schema.
 */
const validateAIRoadmap = (data) => {
  if (!data.phases || !Array.isArray(data.phases) || data.phases.length === 0) {
    throw new AppError(502, 'AI returned an invalid roadmap structure.')
  }

  for (const phase of data.phases) {
    if (!phase.title || !Array.isArray(phase.skills) || phase.skills.length === 0) {
      throw new AppError(502, 'AI returned a phase with missing title or skills.')
    }
    for (const skill of phase.skills) {
      if (!skill.name || typeof skill.name !== 'string') {
        throw new AppError(502, 'AI returned a skill with a missing or invalid name.')
      }
    }
  }
}

// ─── Service Functions ─────────────────────────────────────────────────────────

const generateRoadmap = async (userId, { targetCareer, skillLevel, duration, interests }) => {
  const prompt = buildRoadmapPrompt({ targetCareer, skillLevel, duration, interests })
  const aiData = await callGemini(prompt)

  validateAIRoadmap(aiData)

  const roadmap = await Roadmap.create({
    user: userId,
    targetCareer,
    skillLevel,
    duration,
    interests,
    summary: aiData.summary || '',
    phases: aiData.phases.map((phase, idx) => ({
      title: phase.title,
      order: phase.order ?? idx + 1,
      description: phase.description || '',
      skills: phase.skills.map((s) => ({
        name: s.name,
        completed: false,
      })),
    })),
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
    feedback,
  })

  const aiData = await callGemini(prompt)
  validateAIRoadmap(aiData)

  // Preserve original completion state where skill names match
  const previousSkills = existing.phases
    .flatMap((p) => p.skills)
    .reduce((map, skill) => {
      map[skill.name.toLowerCase()] = skill.completed
      return map
    }, {})

  existing.summary = aiData.summary || existing.summary
  existing.phases = aiData.phases.map((phase, idx) => ({
    title: phase.title,
    order: phase.order ?? idx + 1,
    description: phase.description || '',
    skills: phase.skills.map((s) => ({
      name: s.name,
      // Keep completed = true if this skill existed before
      completed: previousSkills[s.name.toLowerCase()] ?? false,
    })),
  }))

  await existing.save()
  return existing
}

const getRoadmaps = async (userId) => {
  return Roadmap.find({ user: userId, isActive: true })
    .select('-phases')   // lighter list view — phases loaded on detail
    .sort({ createdAt: -1 })
}

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

  const phase = roadmap.phases[phaseIndex]
  if (!phase) throw new AppError(400, 'Invalid phase index')

  const skill = phase.skills[skillIndex]
  if (!skill) throw new AppError(400, 'Invalid skill index')

  skill.completed = completed
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
}