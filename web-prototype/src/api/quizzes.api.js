import { nodeAPI } from './axiosInstance'

export const getQuizQuestions = async (roadmapId, phaseNumber) => {
  const res = await nodeAPI.get(`/quizzes/${roadmapId}/phase/${phaseNumber}`)
  return res.data.data
}

export const submitQuiz = async (roadmapId, phaseNumber, payload) => {
  const res = await nodeAPI.post(`/quizzes/${roadmapId}/phase/${phaseNumber}/submit`, payload)
  return res.data.data
}

export const getQuizResults = async (roadmapId, phaseNumber) => {
  const res = await nodeAPI.get(`/quizzes/${roadmapId}/phase/${phaseNumber}/results`)
  return res.data.data
}

export const getQuizRetakeStatus = async (roadmapId, phaseNumber) => {
  const res = await nodeAPI.get(`/quizzes/${roadmapId}/phase/${phaseNumber}/retake-status`)
  return res.data.data
}
