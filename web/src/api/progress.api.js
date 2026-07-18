import { nodeAPI } from './axiosInstance'

export const getProgressSummary = async () => {
  const response = await nodeAPI.get('/progress/summary')
  return response.data.data.summary
}

export const getAllProgress = async () => {
  const response = await nodeAPI.get('/progress')
  return response.data.data.progress
}

export const getRoadmapProgress = async (roadmapId) => {
  const response = await nodeAPI.get(`/progress/${roadmapId}`)
  return response.data.data.progress
}

export const syncRoadmapProgress = async (roadmapId) => {
  const response = await nodeAPI.post(`/progress/sync/${roadmapId}`)
  return response.data.data.progress
}
