import { nodeAPI } from './axiosInstance'

export const getProgressSummary = async () => {
  const res = await nodeAPI.get('/progress/summary')
  return res.data.data.summary
}

export const getAllProgress = async () => {
  const res = await nodeAPI.get('/progress')
  return res.data.data.progress
}

export const getRoadmapProgress = async (roadmapId) => {
  const res = await nodeAPI.get(`/progress/${roadmapId}`)
  return res.data.data.progress
}

export const syncRoadmapProgress = async (roadmapId) => {
  const res = await nodeAPI.post(`/progress/sync/${roadmapId}`)
  return res.data.data.progress
}
