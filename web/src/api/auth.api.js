import { nodeAPI } from './axiosInstance'

export const registerUser = (data) =>
  nodeAPI.post('/auth/register', data)

export const loginUser = (data) =>
  nodeAPI.post('/auth/login', data)

export const getProfile = () =>
  nodeAPI.get('/auth/profile')

export const updateProfile = (data) =>
  nodeAPI.put('/auth/profile', data)