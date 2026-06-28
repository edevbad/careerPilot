const { param } = require('express-validator')

const roadmapIdValidator = [
  param('roadmapId')
    .isMongoId()
    .withMessage('Invalid roadmapId format'),
]

module.exports = { roadmapIdValidator }