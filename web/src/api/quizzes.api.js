import { nodeAPI } from './axiosInstance'

export const getQuizQuestions = async (roadmapId, phaseNumber) => {
  const response = await nodeAPI.get(`/quizzes/${roadmapId}/phase/${phaseNumber}`)
  return response.data.data
}

export const submitQuiz = async (roadmapId, phaseNumber, payload) => {
  const response = await nodeAPI.post(`/quizzes/${roadmapId}/phase/${phaseNumber}/submit`, payload)
  return response.data.data
}

export const getQuizResults = async (roadmapId, phaseNumber) => {
  const response = await nodeAPI.get(`/quizzes/${roadmapId}/phase/${phaseNumber}/results`)
  return response.data.data
}

export const getQuizRetakeStatus = async (roadmapId, phaseNumber) => {
  const response = await nodeAPI.get(`/quizzes/${roadmapId}/phase/${phaseNumber}/retake-status`)
  return response.data.data
}
