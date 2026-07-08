const express    = require("express");
const router     = express.Router();
const controller = require("./dailyTask.controller");
const protect    = require("../../middlewares/auth.middleware");

// All task routes require authentication
router.use(protect);

// GET  /api/tasks/today          — fetch (and auto-generate) today's tasks
// GET  /api/tasks/history        — per-day summaries for streak calendar
// PATCH /api/tasks/:id/complete  — mark a task done
// PATCH /api/tasks/:id/skip      — skip a task with optional reason

router.get("/today",        controller.getTodaysTasks);
router.get("/history",      controller.getTaskHistory);
router.patch("/:id/complete", controller.completeTask);
router.patch("/:id/skip",     controller.skipTask);

module.exports = router;