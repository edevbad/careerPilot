const {asyncHandler} = require('../../utils/asyncHandler')
const ApiResponse = require('../../utils/apiResponse')
const progressService = require('./progress.service')

const syncProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.syncProgress(req.user._id, req.params.roadmapId)
  res.status(200).json(new ApiResponse(200, { progress }, 'Progress synced'))
})

const getAllProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.getAllProgress(req.user._id)
  res.status(200).json(new ApiResponse(200, { progress }))
})

const getProgressByRoadmap = asyncHandler(async (req, res) => {
  const progress = await progressService.getProgressByRoadmap(req.user._id, req.params.roadmapId)
  res.status(200).json(new ApiResponse(200, { progress }))
})

const getSummary = asyncHandler(async (req, res) => {
  const summary = await progressService.getSummary(req.user._id)
  res.status(200).json(new ApiResponse(200, { summary }))
})

module.exports = { syncProgress, getAllProgress, getProgressByRoadmap, getSummary }