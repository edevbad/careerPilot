const QuizResult = require("../../models/quizresult.model");
const Roadmap    = require("../../models/roadmap.model");
const Progress   = require("../../models/progress.model");
const AppError = require("../../utils/appError");

// ── Helpers ────────────────────────────────────────────────────

// GEMINI HELPERS

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const parseRetryDelay = (msg, defaultMs = 15000) => {
  const match = msg?.match(/retryDelay[^0-9]*(\d+)/);
  return match ? parseInt(match[1], 10) * 1000 : defaultMs;
};

const callGemini = async (prompt, maxRetries = 2) => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const model = getGeminiModel();

      const result = await model.generateContent({
        systemInstruction:
          "You are an AI career coach that always responds with valid JSON only.",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      const raw = result.response.text();

      if (!raw?.trim()) {
        throw new AppError(502, "AI returned an empty response.");
      }

      const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        console.error("Unparseable Gemini response:", raw);
        throw new AppError(502, "AI returned malformed JSON.");
      }
    } catch (err) {
      const msg = err.message || "";
      const is429 = msg.includes("429") || msg.includes("Too Many Requests");
      const isQuota = msg.includes("quota");

      if ((is429 || isQuota) && attempt < maxRetries) {
        const delay = parseRetryDelay(msg, 20000);
        console.warn(
          `Gemini rate limit. Retrying in ${delay / 1000}s...`
        );

        await sleep(delay);
        attempt++;
        continue;
      }

      if (isQuota && msg.includes("limit: 0")) {
        throw new AppError(
          503,
          "AI daily quota reached. Please try again tomorrow."
        );
      }

      if (is429 || isQuota) {
        throw new AppError(
          429,
          "AI service is busy. Please wait and try again."
        );
      }

      if (err.statusCode) throw err;

      throw new AppError(502, `AI service error: ${msg}`);
    }
  }
};

// GEMINI HELPERS

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const parseRetryDelay = (msg, defaultMs = 15000) => {
  const match = msg?.match(/retryDelay[^0-9]*(\d+)/);
  return match ? parseInt(match[1], 10) * 1000 : defaultMs;
};

const callGemini = async (prompt, maxRetries = 2) => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const model = getGeminiModel();

      const result = await model.generateContent({
        systemInstruction:
          "You are an AI career coach that always responds with valid JSON only.",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      const raw = result.response.text();

      if (!raw?.trim()) {
        throw new AppError(502, "AI returned an empty response.");
      }

      const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        console.error("Unparseable Gemini response:", raw);
        throw new AppError(502, "AI returned malformed JSON.");
      }
    } catch (err) {
      const msg = err.message || "";
      const is429 = msg.includes("429") || msg.includes("Too Many Requests");
      const isQuota = msg.includes("quota");

      if ((is429 || isQuota) && attempt < maxRetries) {
        const delay = parseRetryDelay(msg, 20000);
        console.warn(
          `Gemini rate limit. Retrying in ${delay / 1000}s...`
        );

        await sleep(delay);
        attempt++;
        continue;
      }

      if (isQuota && msg.includes("limit: 0")) {
        throw new AppError(
          503,
          "AI daily quota reached. Please try again tomorrow."
        );
      }

      if (is429 || isQuota) {
        throw new AppError(
          429,
          "AI service is busy. Please wait and try again."
        );
      }

      if (err.statusCode) throw err;

      throw new AppError(502, `AI service error: ${msg}`);
    }
  }
};

const QUESTION_TYPE_MAP = {
  mcq: "mcq",
  true_false: "true-false",
  "true-false": "true-false",
  truefalse: "true-false",
  code_review: "code-review",
  "code-review": "code-review",
  codereview: "code-review",
};

function normalizeQuestionType(raw) {
  const key = raw?.toLowerCase().trim().replace(/\s+/g, "_");
  return QUESTION_TYPE_MAP[key] || QUESTION_TYPE_MAP[raw?.toLowerCase().trim()] || raw;
}

/**
 * Use Gemini to generate AI-fallback questions when neither the local
 * question bank nor (previously) Laravel had enough for this phase.
 */
async function generateAIQuestions(
  phase,
  targetCareer,
  skillLevel,
  count
) {
  const prompt = `
You are an expert technical quiz writer.

Generate EXACTLY ${count} quiz questions.

Career: ${targetCareer}
Phase: ${phase.phaseNumber} - ${phase.title}
Topics:
${(phase.subTopics || []).map(s => s.title).join(", ") || phase.title}

Student Level:
${skillLevel}

Question distribution:
- 60% MCQ
- 25% True/False
- 15% Code Review

Rules:

- Respond ONLY with JSON.
- No markdown.
- No explanation.

Return:

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

For true-false:
options = {
"A":"True",
"B":"False"
}

For code-review include the code snippet inside questionText.
`;

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
 * Generate study suggestions for a failed attempt using Gemini.
 */
async function generateStudySuggestions(
  phase,
  wrongTopics,
  targetCareer
) {
  const prompt = `
A student failed a quiz.

Career:
${targetCareer}

Phase:
${phase.phaseNumber} - ${phase.title}

Incorrect Topics:
${wrongTopics.join(", ")}

Generate exactly FOUR study suggestions.

Rules:

- Respond ONLY with JSON.
- No markdown.
- No explanation.

Example:

[
"Suggestion 1",
"Suggestion 2",
"Suggestion 3",
"Suggestion 4"
]
`;

  try {
    const suggestions = await callGemini(prompt);

    if (!Array.isArray(suggestions)) {
      throw new Error();
    }

    return suggestions.slice(0, 4);
  } catch {
    return [
      `Review the concepts from Phase ${phase.phaseNumber}: ${phase.title}`,
      "Repeat the daily learning tasks for this phase.",
      "Watch additional tutorials covering the weak topics.",
      "Build a small practice project before attempting the quiz again.",
    ];
  }
}

// ── Core Service Functions ─────────────────────────────────────

/**
 * Fetch a question set for a quiz attempt.
 *
 * Question source priority (Laravel has been removed entirely):
 *   1. Local JSON question bank (data/questionBank/*.json), keyed by
 *      targetCareer + phaseNumber. Zero network calls, zero rate limits.
 *   2. Gemini AI generation, only for whatever shortfall remains after
 *      the local bank (e.g. career not covered locally, or bank has
 *      fewer than QUESTION_TARGET questions for this phase).
 *
 * Correct answers are NEVER included in the returned payload for
 * either source — grading is done via the signed answer token,
 * exactly as it was for AI-generated questions before.
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

  const QUESTION_TARGET = 10;

  // 1) Try the local bank first — no network call, no rate limit risk.
  const localQuestions = getQuestionsFromLocalBank(
    roadmap.targetCareer,
    phaseNumber,
    QUESTION_TARGET
  ).map(adaptLocalBankQuestion);

  let questions = [...localQuestions];

  // 2) Only hit Gemini for whatever shortfall remains.
  if (questions.length < QUESTION_TARGET) {
    const needed = QUESTION_TARGET - questions.length;
    const aiQuestions = await generateAIQuestions(
      phase,
      roadmap.targetCareer,
      roadmap.skillLevel,
      needed
    );
    questions = [...questions, ...aiQuestions];
  }

  // Strip anything answer-bearing before sending to client.
  const safeQuestions = questions.map(
    ({ _correctAnswer, _explanation, correctAnswer, explanation, ...safe }) => safe
  );

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
 *
 * All grading — whether the question came from the local bank or
 * from Gemini — now goes through the same signed-token verification
 * path (verifyAnswer). There is no more DB/Laravel round-trip for
 * grading data: the client must echo back questionText/_explanation/
 * _answerToken for local-bank questions the same way it already did
 * for AI questions, OR (recommended) the frontend looks these up from
 * the original getQuizQuestions payload it cached client-side.
 *
 * NOTE: since correctAnswer/explanation are stripped before the
 * question ever reaches the client, and local-bank questions no
 * longer have a server-side "fetch by ID" step, the client is
 * responsible for submitting back whatever safe metadata it needs
 * displayed post-grading (questionText, topic, etc.) alongside its
 * answer + the token. This mirrors exactly how AI-generated
 * questions already worked before this change — local-bank questions
 * are just no longer a special case.
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

  // Grade every answer via the signed token — works identically for
  // local-bank questions (positive IDs) and AI-generated ones
  // (negative IDs). No DB/Laravel lookup step anymore.
  const gradedAnswers = [];
  let correctCount = 0;
  const wrongTopics = new Set();

  for (const submitted of answers) {
    const isCorrect = verifyAnswer(
      submitted.questionId,
      submitted.userAnswer,
      submitted._answerToken
    );

    if (isCorrect) correctCount++;
    else wrongTopics.add(submitted._topic || phase.title);

    gradedAnswers.push({
      questionId: submitted.questionId,
      questionText: submitted.questionText || "",
      userAnswer: submitted.userAnswer,
      correctAnswer: isCorrect ? submitted.userAnswer : "See explanation",
      isCorrect,
      explanation: submitted._explanation || "",
      questionType: normalizeQuestionType(submitted.questionType) || "mcq",
    });
  }

  const totalQuestions = gradedAnswers.length;
  const passingScore = phase.quizPassingScore || 70;
  const score = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;
  const passed = score >= passingScore;
  const attemptNumber = (await QuizResult.countAttempts(userId, roadmapId, phaseNumber)) + 1;
  const completedAt = new Date();

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

  const hasPassed = results.some(r => r.passed);
  const bestScore = results.length ? Math.max(...results.map(r => r.score)) : null;
  const latest = results.at(-1) || null;

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
  const attemptCount = await QuizResult.countAttempts(userId, roadmapId, phaseNumber);

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