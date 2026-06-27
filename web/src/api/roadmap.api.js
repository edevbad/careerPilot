import { nodeAPI } from './axiosInstance'

export const generateRoadmap = (assessmentData) =>
  nodeAPI.post('/roadmaps/generate', assessmentData)

export const getRoadmaps = () =>
  nodeAPI.get('/roadmaps')

export const getRoadmapById = (id) =>
  nodeAPI.get(`/roadmaps/${id}`)

export const updateRoadmap = (id, data) =>
  nodeAPI.put(`/roadmaps/${id}`, data)

export const deleteRoadmap = (id) =>
  nodeAPI.delete(`/roadmaps/${id}`)

export const updateProgress = (roadmapId, skillId, status) =>
  nodeAPI.patch(`/roadmaps/${roadmapId}/progress/${skillId}`, { completed: status })