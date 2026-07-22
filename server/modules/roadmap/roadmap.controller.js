const {asyncHandler}   = require('../../utils/asyncHandler')
const ApiResponse    = require('../../utils/apiResponse')
const roadmapService = require('./roadmap.service')

const generateRoadmap = asyncHandler(async (req, res) => {
  const { targetCareer, skillLevel, duration, interests, startDate } = req.body
  const roadmap = await roadmapService.generateRoadmap(req.user._id, {
    targetCareer, skillLevel, duration, interests, startDate,
  })
  res.status(201).json(new ApiResponse(201, { roadmap }, 'Roadmap generated successfully'))
})

const regenerateRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await roadmapService.regenerateRoadmap(
    req.user._id, req.params.id, { feedback: req.body.feedback }
  )
  res.status(200).json(new ApiResponse(200, { roadmap }, 'Roadmap regenerated successfully'))
})

const getRoadmaps = asyncHandler(async (req, res) => {
  const roadmaps = await roadmapService.getRoadmaps(req.user._id)
  res.status(200).json(new ApiResponse(200, { roadmaps }))
})

const getRoadmapById = asyncHandler(async (req, res) => {
  const roadmap = await roadmapService.getRoadmapById(req.user._id, req.params.id)
  res.status(200).json(new ApiResponse(200, { roadmap }))
})

const updateRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await roadmapService.updateRoadmap(req.user._id, req.params.id, req.body)
  res.status(200).json(new ApiResponse(200, { roadmap }, 'Roadmap updated'))
})

const deleteRoadmap = asyncHandler(async (req, res) => {
  await roadmapService.deleteRoadmap(req.user._id, req.params.id)
  res.status(200).json(new ApiResponse(200, null, 'Roadmap deleted'))
})

const updateSkillProgress = asyncHandler(async (req, res) => {
  const { phaseIndex, skillIndex, completed } = req.body
  const roadmap = await roadmapService.updateSkillProgress(
    req.user._id, req.params.id, phaseIndex, skillIndex, completed
  )
  res.status(200).json(new ApiResponse(200, { roadmap }, 'Skill progress updated'))
})

const updateTaskProgress = asyncHandler(async (req, res) => {
  const { phaseIndex, skillIndex, taskIndex, completed } = req.body
  const roadmap = await roadmapService.updateTaskProgress(
    req.user._id, req.params.id, phaseIndex, skillIndex, taskIndex, completed
  )
  res.status(200).json(new ApiResponse(200, { roadmap }, 'Task progress updated'))
})

const toggleResourceBookmark = asyncHandler(async (req, res) => {
  const { phaseNumber, resourceUrl } = req.body
  const roadmap = await roadmapService.toggleResourceBookmark(
    req.user._id, req.params.id, phaseNumber, resourceUrl
  )
  res.status(200).json(new ApiResponse(200, { roadmap }, 'Resource bookmark toggled'))
})

const markResourceComplete = asyncHandler(async (req, res) => {
  const { phaseNumber, resourceUrl } = req.body
  const roadmap = await roadmapService.markResourceComplete(
    req.user._id, req.params.id, phaseNumber, resourceUrl
  )
  res.status(200).json(new ApiResponse(200, { roadmap }, 'Resource marked as complete'))
})

module.exports = {
  generateRoadmap,
  regenerateRoadmap,
  getRoadmaps,
  getRoadmapById,
  updateRoadmap,
  deleteRoadmap,
  updateSkillProgress,
  updateTaskProgress,
  toggleResourceBookmark,
  markResourceComplete,
}