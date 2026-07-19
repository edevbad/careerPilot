import { Routes, Route, Navigate } from 'react-router-dom'
import QuizLayout from '@/layouts/QuizLayout'
import QuizScreen from '@/pages/quiz/QuizScreen'
import QuizResults from '@/pages/quiz/QuizResults'

import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'

import AuthLayout from '@/layouts/AuthLayout'
import MainLayout from '@/layouts/MainLayout'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'

import Dashboard from '@/pages/dashboard/Dashboard'
import CareerAssessment from '@/pages/assessment/CareerAssessment'
import GenerateRoadmap from '@/pages/roadmap/GenerateRoadmap'
import RoadmapList from '@/pages/roadmap/RoadmapList'
import RoadmapDetail from '@/pages/roadmap/RoadmapDetail'
import Progress from '@/pages/progress/Progress'
import Resources from '@/pages/resources/Resources'
import Profile from '@/pages/profile/Profile'
import NotFound from '@/pages/NotFound'
import Landing from '@/pages/marketing/Landing'

export default function AppRouter() {
  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes — redirect to /dashboard if already logged in */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
      </Route>

      {/* Private routes — redirect to /login if not authenticated */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assessment" element={<CareerAssessment />} />
          <Route path="/roadmaps" element={<RoadmapList />} />
          <Route path="/roadmaps/generate" element={<GenerateRoadmap />} />
          <Route path="/roadmaps/:id" element={<RoadmapDetail />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />

      {/* Quiz — private but without the main app chrome */}
      <Route element={<PrivateRoute />}>
        <Route element={<QuizLayout />}>
          <Route path="/roadmaps/:roadmapId/quiz/:phaseNumber" element={<QuizScreen />} />
          <Route path="/roadmaps/:roadmapId/quiz/:phaseNumber/results" element={<QuizResults />} />
        </Route>
      </Route>
   

// Replace the current root redirect:
// <Route path="/" element={<Navigate to="/dashboard" replace />} />
<Route path="/" element={<Landing />} />
    </Routes>
  )
}