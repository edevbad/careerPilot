const fs = require("fs");
const path = require("path");

/**
 * Local, file-based question bank.
 *
 * Structure on disk: one JSON file per career, e.g.
 *   data/questionBank/frontend-developer.json
 *   data/questionBank/backend-developer.json
 *
 * Each file:
 * {
 *   "career": "Frontend Developer",
 *   "phases": {
 *     "1": [ { id, questionText, questionType, options, correctAnswer, explanation, difficulty, topic }, ... ],
 *     "2": [ ... ]
 *   }
 * }
 *
 * Files are loaded once and cached in memory. Call reloadQuestionBank()
 * in dev if you edit a JSON file and want it picked up without restarting.
 */

const BANK_DIR = __dirname;

// slug -> { career, phases: { [phaseNumber]: Question[] } }
let bankCache = null;

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function loadBankFromDisk() {
  const bank = {};

  const files = fs
    .readdirSync(BANK_DIR)
    .filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const fullPath = path.join(BANK_DIR, file);
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (err) {
      console.error(`[questionBank] Failed to parse ${file}:`, err.message);
      continue;
    }

    if (!parsed.career || !parsed.phases) {
      console.warn(`[questionBank] Skipping ${file}: missing "career" or "phases"`);
      continue;
    }

    const slug = slugify(parsed.career);
    bank[slug] = parsed;
  }

  return bank;
}

function getBank() {
  if (!bankCache) {
    bankCache = loadBankFromDisk();
  }
  return bankCache;
}

function reloadQuestionBank() {
  bankCache = loadBankFromDisk();
  return bankCache;
}

/**
 * Look up questions for a given career + phase number.
 * Returns [] if the career or phase isn't in the local bank —
 * callers should treat that as "fall through to AI generation".
 *
 * @param {string} targetCareer - e.g. "Frontend Developer"
 * @param {number|string} phaseNumber
 * @param {number} count - max questions to return
 */
function getQuestionsFromLocalBank(targetCareer, phaseNumber, count) {
  if (!targetCareer) return [];

  const bank = getBank();
  const slug = slugify(targetCareer);
  const careerEntry = bank[slug];
  if (!careerEntry) return [];

  const phaseQuestions = careerEntry.phases?.[String(phaseNumber)];
  if (!Array.isArray(phaseQuestions) || phaseQuestions.length === 0) return [];

  // Shallow copy + shuffle so repeated attempts don't always see the
  // same order (does not guarantee full randomness across many attempts
  // if the pool is small).
  const shuffled = [...phaseQuestions].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count);
}

/**
 * List which careers currently have local bank coverage.
 * Useful for logging/debugging or an admin endpoint.
 */
function listCoveredCareers() {
  const bank = getBank();
  return Object.values(bank).map((entry) => ({
    career: entry.career,
    phases: Object.keys(entry.phases).map(Number).sort((a, b) => a - b),
  }));
}

module.exports = {
  getQuestionsFromLocalBank,
  listCoveredCareers,
  reloadQuestionBank,
};