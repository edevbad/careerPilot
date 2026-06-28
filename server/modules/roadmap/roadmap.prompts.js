/**
 * Builds the system instruction that constrains Gemini's persona
 * and output format strictly.
 */
const SYSTEM_INSTRUCTION = `
You are CareerPilot's AI career advisor. Your sole job is to generate 
structured, practical learning roadmaps for students based on their 
career goals and current skill level.

STRICT RULES:
- Always respond with valid JSON only. No markdown, no backticks, no explanation.
- Never include text outside the JSON structure.
- Phases must be ordered from foundational to advanced.
- Each phase must have 3 to 5 skills.
- Skill names must be concise (1 to 5 words).
- Generate between 3 and 5 phases total depending on skill level and duration.
- Beginner: start from absolute basics.
- Intermediate: skip fundamentals, start from core tools.
- Advanced: focus on architecture, optimization, and real-world projects.
`.trim()

/**
 * Builds the user prompt sent to Gemini for roadmap generation.
 */
const buildRoadmapPrompt = ({ targetCareer, skillLevel, duration, interests }) => `
Generate a personalized learning roadmap for the following student:

Target Career: ${targetCareer}
Current Skill Level: ${skillLevel}
Available Learning Time: ${duration}
Interests / Notes: ${interests || 'None provided'}

Return ONLY a JSON object in this exact shape:

{
  "targetCareer": "${targetCareer}",
  "summary": "A 1-2 sentence personalized overview of this roadmap",
  "phases": [
    {
      "title": "Phase title",
      "order": 1,
      "description": "One sentence describing the goal of this phase",
      "skills": [
        { "name": "Skill Name", "completed": false },
        { "name": "Skill Name", "completed": false }
      ]
    }
  ]
}

Remember: respond with JSON only, no extra text.
`.trim()

/**
 * Builds the prompt for regenerating a roadmap with optional user feedback.
 */
const buildRegeneratePrompt = ({ targetCareer, skillLevel, duration, interests, feedback }) => `
Regenerate an improved learning roadmap for this student.

Target Career: ${targetCareer}
Current Skill Level: ${skillLevel}
Available Learning Time: ${duration}
Interests / Notes: ${interests || 'None provided'}
User Feedback on Previous Roadmap: ${feedback || 'No specific feedback provided'}

Apply the feedback to improve the roadmap. 
Return ONLY a JSON object in this exact shape:

{
  "targetCareer": "${targetCareer}",
  "summary": "A 1-2 sentence personalized overview of this roadmap",
  "phases": [
    {
      "title": "Phase title",
      "order": 1,
      "description": "One sentence describing the goal of this phase",
      "skills": [
        { "name": "Skill Name", "completed": false },
        { "name": "Skill Name", "completed": false }
      ]
    }
  ]
}

Remember: respond with JSON only, no extra text.
`.trim()

module.exports = {
  SYSTEM_INSTRUCTION,
  buildRoadmapPrompt,
  buildRegeneratePrompt,
}