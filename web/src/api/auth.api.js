import { nodeAPI } from './axiosInstance'

export const registerUser =async (data) => {
  const res = await nodeAPI.post('/auth/register', data)
  return res.data
}

export const loginUser = async(data) =>{
  const res = await nodeAPI.post('/auth/login', data)
  return res.data
}

export const logoutUser = async () => {
  const res = await nodeAPI.post('/auth/logout')
  return res.data
}

export const refreshToken = async () => {
  const res = await nodeAPI.post('/auth/refresh-token')
  return res.data
}

export const getProfile =async () =>{
  const res = await nodeAPI.get('/auth/profile')
  return res.data
}

export const updateProfile = async (data) => {
  const res = await nodeAPI.put('/auth/profile', data)
  return res.data
}