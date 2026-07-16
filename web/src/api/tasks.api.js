import { nodeAPI } from './axiosInstance'

export const getTodayTasks = async (roadmapId) => {
  const params = roadmapId ? { roadmapId } : {}
  const response = await nodeAPI.get('/tasks/today', { params })
  return response.data.data
}

export const completeTask = async (taskId) => {
  const response = await nodeAPI.patch(`/tasks/${taskId}/complete`)
  return response.data.data
}

export const skipTask = async (taskId, reason) => {
  const response = await nodeAPI.patch(`/tasks/${taskId}/skip`, { reason })
  return response.data.data
}

export const getTaskHistory = async (startDate, endDate) => {
  const response = await nodeAPI.get('/tasks/history', { params: { startDate, endDate } })
  return response.data.data.history
}
