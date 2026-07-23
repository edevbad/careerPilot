import { nodeAPI } from './axiosInstance'

export const getTodayTasks = async (roadmapId) => {
  const params = roadmapId ? { roadmapId } : {}
  const res = await nodeAPI.get('/tasks/today', { params })
  return res.data.data  // { tasks, summary }
}

export const completeTask = async (taskId) => {
  const res = await nodeAPI.patch(`/tasks/${taskId}/complete`)
  return res.data.data  // { task, xpEarned, streak }
}

export const skipTask = async (taskId, reason) => {
  const res = await nodeAPI.patch(`/tasks/${taskId}/skip`, { reason })
  return res.data.data  // { task }
}

export const getTaskHistory = async (startDate, endDate) => {
  const res = await nodeAPI.get('/tasks/history', { params: { startDate, endDate } })
  return res.data.data.history
}
