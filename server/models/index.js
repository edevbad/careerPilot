/**
 * models/index.js
 * Central export for all Mongoose models.
 * Import from here throughout the app:
 *   const { User, Roadmap } = require('./models');
 */

const User       = require("./User");
const Roadmap    = require("./Roadmap");
const Progress   = require("./Progress");
const DailyTask  = require("./DailyTask");
const QuizResult = require("./QuizResult");

module.exports = { User, Roadmap, Progress, DailyTask, QuizResult };
