const express = require('express')
const router  = express.Router()
const { protect } = require('../../middlewares/auth.middleware')
const validate    = require('../../middlewares/validate.middleware')
const {
  mongoIdValidator,
  generateRoadmapValidator,
  regenerateRoadmapValidator,
  updateRoadmapValidator,
  updateSkillProgressValidator,
} = require('./roadmap.validators')
const {
  generateRoadmap,
  regenerateRoadmap,
  getRoadmaps,
  getRoadmapById,
  updateRoadmap,
  deleteRoadmap,
  updateSkillProgress,
} = require('./roadmap.controller')

router.use(protect)

router.post('/generate',
  validate(generateRoadmapValidator),
  generateRoadmap
)

router.post('/:id/regenerate',
  validate([...mongoIdValidator('id'), ...regenerateRoadmapValidator]),
  regenerateRoadmap
)

router.get('/',    getRoadmaps)

router.get('/:id',
  validate(mongoIdValidator('id')),
  getRoadmapById
)

router.put('/:id',
  validate([...mongoIdValidator('id'), ...updateRoadmapValidator]),
  updateRoadmap
)

router.delete('/:id',
  validate(mongoIdValidator('id')),
  deleteRoadmap
)

router.patch('/:id/progress',
  validate([...mongoIdValidator('id'), ...updateSkillProgressValidator]),
  updateSkillProgress
)

module.exports = router