import { nodeAPI } from './axiosInstance'

export const generateRoadmap    = (data) => nodeAPI.post('/roadmaps/generate', data)
export const regenerateRoadmap  = (id, feedback = '') => nodeAPI.post(`/roadmaps/${id}/regenerate`, { feedback })
export const getRoadmaps        = () => nodeAPI.get('/roadmaps')
export const getRoadmapById     = (id) => nodeAPI.get(`/roadmaps/${id}`)
export const updateRoadmap      = (id, data) => nodeAPI.put(`/roadmaps/${id}`, data)
export const deleteRoadmap      = (id) => nodeAPI.delete(`/roadmaps/${id}`)

export const updateSkillProgress = (roadmapId, phaseIndex, skillIndex, completed) =>
  nodeAPI.patch(`/roadmaps/${roadmapId}/skill-progress`, {
    phaseIndex, skillIndex, completed,
  })

export const updateTaskProgress = (roadmapId, phaseIndex, skillIndex, taskIndex, completed) =>
  nodeAPI.patch(`/roadmaps/${roadmapId}/task-progress`, {
    phaseIndex, skillIndex, taskIndex, completed,
  })