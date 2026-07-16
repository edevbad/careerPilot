const asyncHandler  = require("express-async-handler");
const quizService   = require("./quiz.service");
const ApiResponse   = require("../../utils/ApiResponse");

// ── GET /quizzes/:roadmapId/phase/:phaseNumber ─────────────────
/**
 * Fetch a randomised question set for a quiz attempt.
 * Correct answers are NEVER included in this response.
 * Guards: phase must be active, no active cooldown, not already passed.
 */
const getQuizQuestions = asyncHandler(async (req, res) => {
  const userId      = req.user._id;
  const { roadmapId, phaseNumber } = req.params;
  const phase       = parseInt(phaseNumber, 10);

  if (isNaN(phase) || phase < 1) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "phaseNumber must be a positive integer"));
  }

  const data = await quizService.getQuizQuestions(userId, roadmapId, phase);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Quiz questions fetched successfully"));
});

// ── POST /quizzes/:roadmapId/phase/:phaseNumber/submit ─────────
/**
 * Submit answers for a quiz attempt.
 * Body:
 * {
 *   "startedAt": "2026-07-09T10:00:00Z",   // ISO timestamp from when questions were fetched
 *   "answers": [
 *     {
 *       "questionId": 42,                   // Positive = Laravel DB, Negative = AI-generated
 *       "userAnswer": "A",                  // null if skipped
 *       "questionType": "mcq",
 *       // AI questions only:
 *       "_correctAnswer": "B",
 *       "_explanation": "Because...",
 *       "_topic": "Async/Await",
 *       "questionText": "What does async do?"
 *     }
 *   ]
 * }
 *
 * Response includes: score, passed, per-answer feedback, study suggestions,
 * nextPhaseUnlocked flag, and updated activePhaseNumber.
 */
const submitQuiz = asyncHandler(async (req, res) => {
  const userId      = req.user._id;
  const { roadmapId, phaseNumber } = req.params;
  const phase       = parseInt(phaseNumber, 10);
  const { answers, startedAt } = req.body;

  if (isNaN(phase) || phase < 1) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "phaseNumber must be a positive integer"));
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "answers must be a non-empty array"));
  }

  if (!startedAt || isNaN(new Date(startedAt))) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "startedAt is required and must be a valid ISO date"));
  }

  const result = await quizService.submitQuiz(userId, roadmapId, phase, { answers, startedAt });

  const message = result.passed
    ? `Quiz passed with ${result.score}%! ${result.nextPhaseUnlocked ? "Next phase unlocked 🎉" : ""}`
    : `Quiz failed. Score: ${result.score}%. You need ${result.passingScore}% to pass. Try again in 24 hours.`;

  return res
    .status(200)
    .json(new ApiResponse(200, result, message));
});

// ── GET /quizzes/:roadmapId/phase/:phaseNumber/results ─────────
/**
 * Fetch all attempt history for a phase quiz.
 * Returns attempts in chronological order (without per-answer detail).
 * Includes: hasPassed, bestScore, totalAttempts, canRetake.
 */
const getPhaseResults = asyncHandler(async (req, res) => {
  const userId      = req.user._id;
  const { roadmapId, phaseNumber } = req.params;
  const phase       = parseInt(phaseNumber, 10);

  if (isNaN(phase) || phase < 1) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "phaseNumber must be a positive integer"));
  }

  const data = await quizService.getPhaseResults(userId, roadmapId, phase);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Quiz results fetched successfully"));
});

// ── GET /quizzes/:roadmapId/phase/:phaseNumber/retake-status ───
/**
 * Lightweight eligibility check — used to gate the "Start Quiz" button.
 * Returns: canTake, reason, minutesRemaining (if on cooldown),
 *          studySuggestions (if on cooldown after a fail).
 */
const getRetakeStatus = asyncHandler(async (req, res) => {
  const userId      = req.user._id;
  const { roadmapId, phaseNumber } = req.params;
  const phase       = parseInt(phaseNumber, 10);

  if (isNaN(phase) || phase < 1) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "phaseNumber must be a positive integer"));
  }

  const status = await quizService.getRetakeStatus(userId, roadmapId, phase);

  return res
    .status(200)
    .json(new ApiResponse(200, status, "Retake status fetched"));
});

module.exports = { getQuizQuestions, submitQuiz, getPhaseResults, getRetakeStatus };