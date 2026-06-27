// Redirects to CareerAssessment — roadmap generation happens through the assessment flow
import { Navigate } from 'react-router-dom'

export default function GenerateRoadmap() {
  return <Navigate to="/assessment" replace />
}