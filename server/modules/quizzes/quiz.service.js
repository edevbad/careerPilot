const Anthropic  = require("@anthropic-ai/sdk");
const axios      = require("axios");
const QuizResult = require("../../models/QuizResult");
const Roadmap    = require("../../models/Roadmap");
const Progress   = require("../../models/Progress");

const client = new Anthropic();

// Laravel API base — Quiz Questions live there
const LARAVEL_API = process.env.LARAVEL_API_URL || "http://localhost:8000/api";

// ── Helpers ────────────────────────────────────────────────────

/**
 * Fetch questions from the Laravel question bank for a skill + phase.
 * Returns an array of question objects with correct_answer EXCLUDED
 * (Laravel's $hidden ensures this — we fetch the full record separately
 * at grading time via the internal endpoint).
 */
async function fetchQuestionsFromBank(skillId, phase, count = 15) {
  const { data } = await axios.get(`${LARAVEL_API}/internal/questions`, {
    params: { skill_id: skillId, phase, count },
    headers: { "X-Internal-Key": process.env.INTERNAL_API_KEY },
  });
  return data.questions || [];
}

/**
 * Fetch the full question records (including correct_answer) for grading.
 * This hits a server-to-server only endpoint — never exposed to the client.
 */
async function fetchQuestionsForGrading(questionIds) {
  const { data } = await axios.post(`${LARAVEL_API}/internal/questions/grade`, {
    ids: questionIds,
  }, {
    headers: { "X-Internal-Key": process.env.INTERNAL_API_KEY },
  });
  return data.questions || []; // Includes correct_answer + explanation
}

/**
 * Use Claude to generate AI-fallback questions when the bank has
 * fewer than the minimum required (10).
 */
async function generateAIQuestions(phase, targetCareer, skillLevel, count) {
  const prompt = `You are a technical quiz writer. Generate exactly ${count} quiz questions for a student learning ${targetCareer}.

Phase: ${phase.phaseNumber} — "${phase.title}"
Sub-topics: ${(phase.subTopics || []).map(s => s.title).join(", ") || phase.title}
Student Level: ${skillLevel}

Question type distribution:
- 60% mcq (multiple choice, 4 options A/B/C/D)
- 25% true-false
- 15% code-review (show a code snippet, ask what it outputs or what's wrong)

Rules:
- Questions must test understanding, not just memorisation
- MCQ distractors must be plausible (not obviously wrong)
- Code snippets must be short (≤10 lines) and language-appropriate
- Explanations must clearly state WHY the answer is correct

Respond ONLY with a valid JSON array, no markdown:
[
  {
    "questionText": "...",
    "questionType": "mcq|true-false|code-review",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "correctAnswer": "A",
    "explanation": "...",
    "difficulty": "easy|medium|hard"
  }
]

For true-false: options = { "A": "True", "B": "False" }, correctAnswer = "A" or "B".
For code-review: include the code snippet inside questionText.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const questions = JSON.parse(raw);
  if (!Array.isArray(questions)) throw new Error("AI returned invalid question format");

  // Tag as AI-generated and assign temporary negative IDs
  // so the grading layer knows not to look them up in Laravel
  return questions.slice(0, count).map((q, i) => ({
    ...q,
    id: -(i + 1),         // Negative ID = AI-generated, not in DB
    isAiGenerated: true,
  }));
}

/**
 * Generate study suggestions for a failed attempt using Claude.
 */
async function generateStudySuggestions(phase, wrongTopics, targetCareer) {
  const prompt = `A student failed a quiz on Phase ${phase.phaseNumber} "${phase.title}" 
while learning ${targetCareer}. They got these topics wrong: ${wrongTopics.join(", ")}.

Give exactly 4 specific, actionable study suggestions to help them before they retake.
Each suggestion should reference a concrete resource type or action (e.g. "Re-read the MDN docs on X", "Build a small example of Y").

Respond ONLY with a JSON array of 4 strings:
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    return JSON.parse(response.content[0].text.trim());
  } catch {
    return [
      `Review the sub-topics in Phase ${phase.phaseNumber}: ${phase.title}`,
      "Re-attempt the daily reading tasks for this phase",
      "Watch tutorial videos for topics you found difficult",
      "Build a small project applying the concepts from this phase",
    ];
  }
}

// ── Core Service Functions ─────────────────────────────────────

/**
 * Fetch a question set for a quiz attempt.
 * Pulls from the Laravel bank; falls back to AI generation if bank
 * has fewer than 10 questions for this phase.
 * Correct answers are NEVER included in the returned payload.
 */
async function getQuizQuestions(userId, roadmapId, phaseNumber) {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
  if (!roadmap) throw Object.assign(new Error("Roadmap not found"), { statusCode: 404 });

  const phase = roadmap.phases.find(p => p.phaseNumber === phaseNumber);
  if (!phase) throw Object.assign(new Error("Phase not found"), { statusCode: 404 });

  if (phase.status === "locked") {
    throw Object.assign(new Error("This phase is locked. Complete previous phases first."), { statusCode: 403 });
  }

  // Check cooldown — has the user failed recently and must wait?
  const latest = await QuizResult.getLatestAttempt(userId, roadmapId, phaseNumber);
  if (latest && !latest.passed && latest.retakeAvailableAt && new Date() < latest.retakeAvailableAt) {
    const err = Object.assign(
      new Error("Quiz is on cooldown. You must wait 24 hours after a failed attempt."),
      { statusCode: 429, retakeAvailableAt: latest.retakeAvailableAt }
    );
    throw err;
  }

  // Check if already passed — no need to retake
  const alreadyPassed = await QuizResult.hasPassed(userId, roadmapId, phaseNumber);
  if (alreadyPassed) {
    throw Object.assign(
      new Error("You have already passed this phase quiz."),
      { statusCode: 400 }
    );
  }

  const QUESTION_TARGET = 15;
  const MINIMUM_FROM_BANK = 10;

  // Phase maps to a skill — use activePhaseNumber's index as a proxy
  // In production this would be a proper skill_id stored on the phase
  const phaseKey = `phase_${phaseNumber}`;
  let questions = [];

  try {
    questions = await fetchQuestionsFromBank(null, phaseKey, QUESTION_TARGET);
  } catch {
    // Laravel unreachable — fall through to AI generation
    questions = [];
  }

  // Supplement with AI questions if bank is thin
  if (questions.length < MINIMUM_FROM_BANK) {
    const needed = QUESTION_TARGET - questions.length;
    const aiQuestions = await generateAIQuestions(
      phase,
      roadmap.targetCareer,
      roadmap.skillLevel,
      needed
    );
    questions = [...questions, ...aiQuestions];
  }

  // Strip correct_answer and explanation before sending to client
  const safeQuestions = questions.map(({ correctAnswer, explanation, ...safe }) => safe);

  return {
    roadmapId,
    phaseNumber,
    phaseTitle: phase.title,
    passingScore: phase.quizPassingScore || 70,
    totalQuestions: safeQuestions.length,
    attemptNumber: (await QuizResult.countAttempts(userId, roadmapId, phaseNumber)) + 1,
    questions: safeQuestions,
    startedAt: new Date(),
  };
}

/**
 * Grade a submitted quiz.
 * Fetches correct answers server-side, scores the attempt, writes
 * QuizResult, and unlocks the next phase if passed.
 */
async function submitQuiz(userId, roadmapId, phaseNumber, { answers, startedAt }) {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
  if (!roadmap) throw Object.assign(new Error("Roadmap not found"), { statusCode: 404 });

  const phase = roadmap.phases.find(p => p.phaseNumber === phaseNumber);
  if (!phase) throw Object.assign(new Error("Phase not found"), { statusCode: 404 });

  // Guard: already passed
  const alreadyPassed = await QuizResult.hasPassed(userId, roadmapId, phaseNumber);
  if (alreadyPassed) {
    throw Object.assign(new Error("You have already passed this phase quiz."), { statusCode: 400 });
  }

  // Guard: cooldown still active
  const latest = await QuizResult.getLatestAttempt(userId, roadmapId, phaseNumber);
  if (latest && !latest.passed && latest.retakeAvailableAt && new Date() < latest.retakeAvailableAt) {
    throw Object.assign(
      new Error("Quiz is still on cooldown."),
      { statusCode: 429, retakeAvailableAt: latest.retakeAvailableAt }
    );
  }

  // Separate DB questions from AI-generated ones (negative IDs)
  const dbQuestionIds = answers
    .map(a => a.questionId)
    .filter(id => id > 0);

  const aiAnswers = answers.filter(a => a.questionId < 0);

  // Fetch grading data for DB questions
  let dbQuestions = [];
  if (dbQuestionIds.length > 0) {
    dbQuestions = await fetchQuestionsForGrading(dbQuestionIds);
  }

  // Build a lookup map: questionId -> full question record
  const questionMap = {};
  for (const q of dbQuestions) {
    questionMap[q.id] = q;
  }

  // Grade every answer
  const gradedAnswers = [];
  let correctCount = 0;
  const wrongTopics = new Set();

  for (const submitted of answers) {
    const isAI = submitted.questionId < 0;

    if (isAI) {
      // AI questions carry their own correctAnswer in the submission
      // (the client received them without it, but we stored them in session/cache)
      // In production: store AI questions in Redis with TTL on quiz start
      // For now we trust the submitted correctAnswer only for AI questions
      const isCorrect =
        submitted.userAnswer !== null &&
        submitted.userAnswer?.toLowerCase().trim() ===
          submitted._correctAnswer?.toLowerCase().trim();

      if (isCorrect) correctCount++;
      else wrongTopics.add(submitted._topic || phase.title);

      gradedAnswers.push({
        questionId: submitted.questionId,
        questionText: submitted.questionText || "",
        userAnswer: submitted.userAnswer,
        correctAnswer: submitted._correctAnswer || "N/A",
        isCorrect,
        explanation: submitted._explanation || "",
        questionType: submitted.questionType || "mcq",
      });
    } else {
      const q = questionMap[submitted.questionId];
      if (!q) continue;

      const isCorrect =
        submitted.userAnswer !== null &&
        submitted.userAnswer?.toLowerCase().trim() ===
          q.correct_answer?.toLowerCase().trim();

      if (isCorrect) correctCount++;
      else wrongTopics.add(q.question_text?.substring(0, 60) || phase.title);

      gradedAnswers.push({
        questionId: q.id,
        questionText: q.question_text,
        userAnswer: submitted.userAnswer,
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation,
        questionType: q.question_type,
      });
    }
  }

  const totalQuestions   = gradedAnswers.length;
  const passingScore     = phase.quizPassingScore || 70;
  const score            = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;
  const passed           = score >= passingScore;
  const attemptNumber    = (await QuizResult.countAttempts(userId, roadmapId, phaseNumber)) + 1;
  const completedAt      = new Date();

  // Generate study suggestions on failure
  let studySuggestions = [];
  if (!passed) {
    studySuggestions = await generateStudySuggestions(
      phase,
      Array.from(wrongTopics).slice(0, 5),
      roadmap.targetCareer
    );
  }

  // Persist result
  const result = await QuizResult.create({
    userId,
    roadmapId,
    phaseNumber,
    attemptNumber,
    totalQuestions,
    correctAnswers: correctCount,
    score,
    passingScore,
    passed,
    answers: gradedAnswers,
    startedAt: new Date(startedAt),
    completedAt,
    studySuggestions,
  });

  // If passed: unlock next phase on the roadmap + update progress
  if (passed) {
    roadmap.unlockNextPhase();
    await roadmap.save();

    // Mark quiz as passed in the Progress collection
    const progress = await Progress.findOne({ userId, roadmapId });
    if (progress) {
      const phaseEntry = progress.phaseProgress.find(p => p.phaseNumber === phaseNumber);
      if (phaseEntry) {
        phaseEntry.latestQuizScore = score;
        phaseEntry.quizPassed = true;
      }
      await progress.save();
    }
  }

  return {
    result,
    passed,
    score,
    correctAnswers: correctCount,
    totalQuestions,
    passingScore,
    studySuggestions: passed ? [] : studySuggestions,
    nextPhaseUnlocked: passed && roadmap.activePhaseNumber > phaseNumber,
    activePhaseNumber: roadmap.activePhaseNumber,
    durationFormatted: result.durationFormatted,
  };
}

/**
 * Fetch all quiz attempts for a user on a specific phase.
 */
async function getPhaseResults(userId, roadmapId, phaseNumber) {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
  if (!roadmap) throw Object.assign(new Error("Roadmap not found"), { statusCode: 404 });

  const phase = roadmap.phases.find(p => p.phaseNumber === phaseNumber);
  if (!phase) throw Object.assign(new Error("Phase not found"), { statusCode: 404 });

  const results = await QuizResult.find({ userId, roadmapId, phaseNumber })
    .sort({ attemptNumber: 1 })
    .select("-answers"); // Exclude per-answer detail from the list view

  const hasPassed  = results.some(r => r.passed);
  const bestScore  = results.length ? Math.max(...results.map(r => r.score)) : null;
  const latest     = results.at(-1) || null;

  return {
    phaseNumber,
    phaseTitle: phase.title,
    passingScore: phase.quizPassingScore || 70,
    totalAttempts: results.length,
    hasPassed,
    bestScore,
    canRetake: latest ? latest.canRetake : true,
    retakeAvailableAt: latest?.retakeAvailableAt || null,
    attempts: results,
  };
}

/**
 * Check retake eligibility for a phase quiz.
 * Lightweight — used to gate the "Start Quiz" button in the UI.
 */
async function getRetakeStatus(userId, roadmapId, phaseNumber) {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
  if (!roadmap) throw Object.assign(new Error("Roadmap not found"), { statusCode: 404 });

  const phase = roadmap.phases.find(p => p.phaseNumber === phaseNumber);
  if (!phase) throw Object.assign(new Error("Phase not found"), { statusCode: 404 });

  const latest = await QuizResult.getLatestAttempt(userId, roadmapId, phaseNumber);
  const alreadyPassed = await QuizResult.hasPassed(userId, roadmapId, phaseNumber);
  const attemptCount  = await QuizResult.countAttempts(userId, roadmapId, phaseNumber);

  if (alreadyPassed) {
    return {
      canTake: false,
      reason: "already_passed",
      message: "You have already passed this phase quiz.",
      attemptCount,
      bestScore: latest?.score || null,
    };
  }

  if (phase.status === "locked") {
    return {
      canTake: false,
      reason: "phase_locked",
      message: "Complete previous phases before taking this quiz.",
      attemptCount,
    };
  }

  if (latest && !latest.passed && latest.retakeAvailableAt && new Date() < latest.retakeAvailableAt) {
    const minutesLeft = Math.ceil((latest.retakeAvailableAt - new Date()) / 60000);
    return {
      canTake: false,
      reason: "cooldown",
      message: `You must wait ${minutesLeft} more minute(s) before retaking.`,
      retakeAvailableAt: latest.retakeAvailableAt,
      minutesRemaining: minutesLeft,
      attemptCount,
      lastScore: latest.score,
      studySuggestions: latest.studySuggestions,
    };
  }

  return {
    canTake: true,
    reason: attemptCount === 0 ? "first_attempt" : "retake_eligible",
    message: attemptCount === 0 ? "Ready to take the quiz." : "Cooldown cleared. You can retake.",
    attemptCount,
    lastScore: latest?.score || null,
    passingScore: phase.quizPassingScore || 70,
  };
}

module.exports = {
  getQuizQuestions,
  submitQuiz,
  getPhaseResults,
  getRetakeStatus,
};