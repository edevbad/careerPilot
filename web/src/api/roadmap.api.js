import { nodeAPI } from './axiosInstance'

export const generateRoadmap = (assessmentData) =>
  nodeAPI.post('/roadmaps/generate', assessmentData)

// src/api/roadmap.api.js — add this function
export const regenerateRoadmap = (id, feedback = '') =>
  nodeAPI.post(`/roadmaps/${id}/regenerate`, { feedback })

export const getRoadmaps = () =>
  nodeAPI.get('/roadmaps')

export const getRoadmapById = (id) =>
  nodeAPI.get(`/roadmaps/${id}`)

export const updateRoadmap = (id, data) =>
  nodeAPI.put(`/roadmaps/${id}`, data)

export const deleteRoadmap = (id) =>
  nodeAPI.delete(`/roadmaps/${id}`)

export const updateProgress = (roadmapId, skillIdx, phaseIdx, status) =>
  nodeAPI.patch(`/roadmaps/${roadmapId}/progress`, { completed: status , skillIndex :  skillIdx, phaseIndex : phaseIdx })