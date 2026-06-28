import { laravelAPI } from './axiosInstance'

export const getResources = (skillId) =>
  laravelAPI.get(`/resources`, { params: { skill_id: skillId } })

export const getSkills = () =>
  laravelAPI.get('/skills')

// Admin only
export const createSkill = (data) =>
  laravelAPI.post('/skills', data)

export const updateSkill = (id, data) =>
  laravelAPI.put(`/skills/${id}`, data)

export const deleteSkill = (id) =>
  laravelAPI.delete(`/skills/${id}`)

export const createResource = (data) =>
  laravelAPI.post('/resources', data)

export const updateResource = (id, data) =>
  laravelAPI.put(`/resources/${id}`, data)

export const deleteResource = (id) =>
  laravelAPI.delete(`/resources/${id}`)