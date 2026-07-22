import { nodeAPI } from './axiosInstance'

export const login = async (email, password) => {
  const res = await nodeAPI.post('/auth/login', { email, password })
  return res.data.data  // { accessToken, user }
}

export const register = async (name, email, password, confirmPassword) => {
  const res = await nodeAPI.post('/auth/register', { name, email, password, confirmPassword })
  return res.data.data  // { accessToken, user }
}

export const logout = async () => {
  await nodeAPI.post('/auth/logout')
}

export const refreshToken = async () => {
  const res = await nodeAPI.post('/auth/refresh-token')
  return res.data.data  // { accessToken, user }
}

export const getProfile = async () => {
  const res = await nodeAPI.get('/auth/profile')
  return res.data.data.user
}

export const updateProfile = async (data) => {
  const res = await nodeAPI.put('/auth/profile', data)
  return res.data.data.user
}
