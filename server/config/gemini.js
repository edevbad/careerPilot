const { GoogleGenerativeAI } = require('@google/generative-ai')

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const getGeminiModel = () =>
  genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.7,        // balanced creativity vs consistency
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  })

module.exports = { getGeminiModel }