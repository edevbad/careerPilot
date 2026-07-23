import { nodeAPI } from './axiosInstance'

export const generateRoadmap = async (data) => {
  const res = await nodeAPI.post('/roadmaps/generate', data)
  return res.data.data.roadmap
}

export const regenerateRoadmap = async (id, feedback = '') => {
  const res = await nodeAPI.post(`/roadmaps/${id}/regenerate`, { feedback })
  return res.data.data.roadmap
}

export const getRoadmaps = async () => {
  const res = await nodeAPI.get('/roadmaps')
  return res.data.data.roadmaps
}

export const getRoadmapById = async (id) => {
  const res = await nodeAPI.get(`/roadmaps/${id}`)
  return res.data.data.roadmap
}

export const updateRoadmap = async (id, data) => {
  const res = await nodeAPI.put(`/roadmaps/${id}`, data)
  return res.data.data.roadmap
}

export const deleteRoadmap = async (id) => {
  await nodeAPI.delete(`/roadmaps/${id}`)
}

export const updateSkillProgress = async (roadmapId, phaseIndex, skillIndex, completed) => {
  const res = await nodeAPI.patch(`/roadmaps/${roadmapId}/skill-progress`, {
    phaseIndex, skillIndex, completed,
  })
  return res.data.data.roadmap
}

export const updateTaskProgress = async (roadmapId, phaseIndex, skillIndex, taskIndex, completed) => {
  const res = await nodeAPI.patch(`/roadmaps/${roadmapId}/task-progress`, {
    phaseIndex, skillIndex, taskIndex, completed,
  })
  return res.data.data.roadmap
}
