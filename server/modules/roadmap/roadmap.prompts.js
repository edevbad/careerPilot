const SYSTEM_INSTRUCTION = `
You are CareerPilot's AI career advisor. Your job is to generate detailed,
structured learning roadmaps with realistic timelines and actionable daily tasks.

STRICT RULES:
- Respond with valid JSON only. No markdown, no backticks, no explanation.
- Never include text outside the JSON structure.
- Phases must be ordered from foundational to advanced.
- Each phase must have 3 to 5 skills.
- Each skill must have 3 to 7 daily tasks spread across its estimated days.
- Daily tasks must be concrete and actionable (e.g. "Build a REST API with 3 endpoints" not "Learn APIs").
- estimatedDays for each skill must be a realistic positive integer.
- All dates must be ISO 8601 strings (YYYY-MM-DD).
- The sum of all skill estimatedDays across all phases must fit within the total duration.
- Beginner: start from absolute basics.
- Intermediate: skip fundamentals, focus on core tools.
- Advanced: focus on architecture, optimization, real-world projects.
`.trim()

/**
 * Converts a duration string like "3 months" into approximate days.
 */
const durationToDays = (duration) => {
  const map = {
    '1 month':  30,
    '3 months': 90,
    '6 months': 180,
    '1 year':   365,
  }
  return map[duration] || 90
}

const buildRoadmapPrompt = ({ targetCareer, skillLevel, duration, interests, startDate }) => {
  const totalDays   = durationToDays(duration)
  const start       = startDate || new Date().toISOString().split('T')[0]

  return `
Generate a personalized learning roadmap for the following student:

Target Career:        ${targetCareer}
Current Skill Level:  ${skillLevel}
Learning Duration:    ${duration} (${totalDays} total days)
Start Date:           ${start}
Interests / Notes:    ${interests || 'None provided'}

Calculate realistic start and end dates for every phase and skill
beginning from ${start}. Phases must be sequential (phase 2 starts
when phase 1 ends). Skills within a phase can overlap slightly but
should generally be sequential.

For every skill generate 7 daily tasks (one per day, day 1 through 7).
If the skill has estimatedDays < 7, consolidate tasks into the available days.
Each daily task must be specific and actionable — something the student
can actually do in 1–2 hours.

Return ONLY a JSON object in this exact shape:

{
  "targetCareer": "${targetCareer}",
  "summary": "A 2-3 sentence personalized overview of this roadmap and what the student will achieve.",
  "startDate": "${start}",
  "endDate": "YYYY-MM-DD",
  "phases": [
    {
      "title": "Phase title",
      "order": 1,
      "description": "One sentence describing the goal of this phase.",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "skills": [
        {
          "name": "Skill name",
          "description": "2-3 sentences explaining what this skill is, why it matters for ${targetCareer}, and what the student will be able to do after mastering it.",
          "estimatedDays": 7,
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD",
          "dailyTasks": [
            {
              "day": 1,
              "title": "Short task title",
              "description": "Specific instruction: what to read, build, or practice today."
            },
            {
              "day": 2,
              "title": "Short task title",
              "description": "Specific instruction: what to read, build, or practice today."
            }
          ]
        }
      ]
    }
  ]
}

Remember: JSON only, no extra text.
`.trim()
}

const buildRegeneratePrompt = ({ targetCareer, skillLevel, duration, interests, startDate, feedback }) => {
  const totalDays = durationToDays(duration)
  const start     = startDate || new Date().toISOString().split('T')[0]

  return `
Regenerate an improved learning roadmap applying the user's feedback.

Target Career:        ${targetCareer}
Current Skill Level:  ${skillLevel}
Learning Duration:    ${duration} (${totalDays} total days)
Start Date:           ${start}
Interests / Notes:    ${interests || 'None provided'}
User Feedback:        ${feedback || 'No specific feedback provided'}

Apply the feedback to meaningfully improve the roadmap structure, skill
descriptions, timelines, and daily tasks.

Return ONLY a JSON object in the same shape as before:

{
  "targetCareer": "${targetCareer}",
  "summary": "2-3 sentence overview.",
  "startDate": "${start}",
  "endDate": "YYYY-MM-DD",
  "phases": [
    {
      "title": "Phase title",
      "order": 1,
      "description": "Phase goal.",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "skills": [
        {
          "name": "Skill name",
          "description": "2-3 sentences about this skill.",
          "estimatedDays": 7,
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD",
          "dailyTasks": [
            { "day": 1, "title": "Task title", "description": "Specific instructions." },
            { "day": 2, "title": "Task title", "description": "Specific instructions." }
          ]
        }
      ]
    }
  ]
}

JSON only, no extra text.
`.trim()
}

module.exports = {
  SYSTEM_INSTRUCTION,
  buildRoadmapPrompt,
  buildRegeneratePrompt,
  durationToDays,
}