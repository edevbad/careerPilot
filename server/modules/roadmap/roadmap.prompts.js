const SYSTEM_INSTRUCTION = `You are CareerPilot, an expert career coach and curriculum designer.
Your job is to generate structured, realistic learning roadmaps for students.
You always respond with valid JSON only — no markdown, no explanation, no extra text.
Every phase must have clear learning objectives written in actionable language.
Difficulty ratings must reflect the actual complexity of the content, not the user's level.`

// ─── Generate ───────────────────────────────────────────────────────────────

const buildRoadmapPrompt = ({ targetCareer, skillLevel, duration, interests, startDate }) => `
Generate a detailed learning roadmap for the following student:

Target Career: ${targetCareer}
Current Skill Level: ${skillLevel}
Preferred Duration: ${duration}
Interests / Focus Areas: ${interests || 'None specified'}
Start Date: ${startDate || new Date().toISOString().split('T')[0]}

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of the roadmap and what the student will achieve",
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase title (e.g. Programming Fundamentals)",
      "summary": "2-4 sentences describing this phase, why it matters, and what it prepares the student for",
      "difficulty": "Beginner | Intermediate | Advanced",
      "estimatedWeeks": 3,
      "prerequisites": [],
      "learningObjectives": [
        "Build a REST API with authentication using Node.js and Express",
        "Write unit tests for all API endpoints using Jest"
      ],
      "subTopics": [
        {
          "order": 1,
          "title": "Variables & Data Types",
          "description": "1-2 sentence description of what this sub-topic covers and why it is important"
        }
      ]
    }
  ]
}

Rules:
- Generate between 3 and 6 phases depending on the career and duration
- phases must be ordered from foundational to advanced — phaseNumber starts at 1
- prerequisites is an array of phaseNumbers that must be completed before this phase (phase 1 always has an empty array)
- estimatedWeeks must be realistic given the duration: "${duration}". All phases combined must roughly equal the total duration
- difficulty must reflect the actual content complexity: early phases for a ${skillLevel} student may still be Beginner even if the student is Intermediate
- learningObjectives must be specific and actionable — start each with a verb (Build, Write, Deploy, Configure, Implement)
- Include 4-8 subTopics per phase ordered by recommended learning sequence
- subTopic descriptions must be 1-2 sentences explaining what is covered and why it matters
- Do NOT include any skills arrays, task arrays, or completion status fields — those are managed separately
- summary at the phase level must explain the PURPOSE of the phase, not just list topics`

// ─── Regenerate ─────────────────────────────────────────────────────────────

const buildRegeneratePrompt = ({ targetCareer, skillLevel, duration, interests, startDate, feedback, completedPhaseNumbers }) => `
Regenerate a learning roadmap with the following adjustments:

Target Career: ${targetCareer}
Current Skill Level: ${skillLevel}
Preferred Duration: ${duration}
Interests / Focus Areas: ${interests || 'None specified'}
Start Date: ${startDate || new Date().toISOString().split('T')[0]}
User Feedback: ${feedback || 'No specific feedback provided'}
${completedPhaseNumbers?.length
  ? `Already Completed Phases: ${completedPhaseNumbers.join(', ')} — do NOT remove or alter these phases. Keep their phaseNumbers identical.`
  : ''}

The user has requested changes to their roadmap. Apply their feedback while keeping the overall structure valid.

Return the same JSON structure as before:
{
  "summary": "...",
  "phases": [
    {
      "phaseNumber": 1,
      "title": "...",
      "summary": "...",
      "difficulty": "Beginner | Intermediate | Advanced",
      "estimatedWeeks": 3,
      "prerequisites": [],
      "learningObjectives": ["..."],
      "subTopics": [
        { "order": 1, "title": "...", "description": "..." }
      ]
    }
  ]
}

Rules:
- Apply the user feedback directly — if they said "focus more on React", add more React-related phases/subTopics
- Do NOT alter phases the user has already completed (phaseNumbers: ${completedPhaseNumbers?.join(', ') || 'none'})
- Keep all other rules from the original generation (estimatedWeeks sum, actionable objectives, ordered subTopics)
- Do NOT include skills, tasks, or status fields`

module.exports = { SYSTEM_INSTRUCTION, buildRoadmapPrompt, buildRegeneratePrompt }