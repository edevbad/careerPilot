const express = require('express')
const router = express.Router()
const { protect } = require('../../middlewares/auth.middleware')
const validate = require('../../middlewares/validate.middleware')
const { roadmapIdValidator } = require('./progress.validators')
const {
  syncProgress,
  getAllProgress,
  getProgressByRoadmap,
  getSummary,
} = require('./progress.controller')

router.use(protect)

router.get('/summary',              getSummary)
router.get('/',                     getAllProgress)

router.get('/:roadmapId',
  validate(roadmapIdValidator),
  getProgressByRoadmap
)

router.post('/sync/:roadmapId',
  validate(roadmapIdValidator),
  syncProgress
)

module.exports = router