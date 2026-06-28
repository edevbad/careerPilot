const { body, param } = require('express-validator')

const VALID_CAREERS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'DevOps Engineer',
  'UI/UX Designer',
  'Mobile Developer',
]

const VALID_SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const VALID_DURATIONS    = ['1 month', '3 months', '6 months', '1 year']

const mongoIdValidator = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
]

const generateRoadmapValidator = [
  body('targetCareer')
    .trim()
    .notEmpty().withMessage('Target career is required')
    .isIn(VALID_CAREERS).withMessage(`Must be one of: ${VALID_CAREERS.join(', ')}`),

  body('skillLevel')
    .notEmpty().withMessage('Skill level is required')
    .isIn(VALID_SKILL_LEVELS).withMessage(`Must be one of: ${VALID_SKILL_LEVELS.join(', ')}`),

  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isIn(VALID_DURATIONS).withMessage(`Must be one of: ${VALID_DURATIONS.join(', ')}`),

  body('interests')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Interests cannot exceed 500 characters'),
]

const regenerateRoadmapValidator = [
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Feedback cannot exceed 1000 characters'),
]

const updateRoadmapValidator = [
  body('targetCareer')
    .not().exists().withMessage('Target career cannot be changed after generation'),

  body('isActive')
    .not().exists().withMessage('Use the delete endpoint to deactivate a roadmap'),
]

const updateSkillProgressValidator = [
  body('phaseIndex')
    .notEmpty().withMessage('phaseIndex is required')
    .isInt({ min: 0 }).withMessage('phaseIndex must be a non-negative integer'),

  body('skillIndex')
    .notEmpty().withMessage('skillIndex is required')
    .isInt({ min: 0 }).withMessage('skillIndex must be a non-negative integer'),

  body('completed')
    .notEmpty().withMessage('completed is required')
    .isBoolean().withMessage('completed must be a boolean'),
]

module.exports = {
  mongoIdValidator,
  generateRoadmapValidator,
  regenerateRoadmapValidator,
  updateRoadmapValidator,
  updateSkillProgressValidator,
}