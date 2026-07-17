const express    = require("express");
const router     = express.Router();
const controller = require("./quiz.controller");
const {protect}    = require("../../middlewares/auth.middleware");

router.use(protect);

// GET  /api/quizzes/:roadmapId/phase/:phaseNumber                — fetch question set
// POST /api/quizzes/:roadmapId/phase/:phaseNumber/submit         — submit answers
// GET  /api/quizzes/:roadmapId/phase/:phaseNumber/results        — attempt history
// GET  /api/quizzes/:roadmapId/phase/:phaseNumber/retake-status  — eligibility check

router.get( "/:roadmapId/phase/:phaseNumber",                controller.getQuizQuestions);
router.post("/:roadmapId/phase/:phaseNumber/submit",         controller.submitQuiz);
router.get( "/:roadmapId/phase/:phaseNumber/results",        controller.getPhaseResults);
router.get( "/:roadmapId/phase/:phaseNumber/retake-status",  controller.getRetakeStatus);

module.exports = router;