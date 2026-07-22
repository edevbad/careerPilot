import { Routes, Route, Navigate } from 'react-router-dom'

import PrivateRoute from './PrivateRoute'
import PublicRoute  from './PublicRoute'

import AuthLayout from '@/layouts/AuthLayout'
import MainLayout from '@/layouts/MainLayout'

import Login          from '@/pages/auth/Login'
import Register       from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'

import Dashboard       from '@/pages/dashboard/Dashboard'
import RoadmapList     from '@/pages/roadmap/RoadmapList'
import GenerateRoadmap from '@/pages/roadmap/GenerateRoadmap'
import RoadmapDetail   from '@/pages/roadmap/RoadmapDetail'
import Tasks           from '@/pages/tasks/Tasks'
import Progress        from '@/pages/progress/Progress'
import QuizStart       from '@/pages/quiz/QuizStart'
import QuizSession     from '@/pages/quiz/QuizSession'
import Profile         from '@/pages/profile/Profile'
import NotFound        from '@/pages/NotFound'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public — redirects to /dashboard if logged in */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
      </Route>

      {/* Private — redirects to /login if not logged in */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard"           element={<Dashboard />} />
          <Route path="/roadmaps"            element={<RoadmapList />} />
          <Route path="/roadmaps/generate"   element={<GenerateRoadmap />} />
          <Route path="/roadmaps/:id"        element={<RoadmapDetail />} />
          <Route path="/tasks"               element={<Tasks />} />
          <Route path="/progress"            element={<Progress />} />
          <Route path="/quiz/:roadmapId/phase/:phaseNumber" element={<QuizStart />} />
          <Route path="/quiz/:roadmapId/phase/:phaseNumber/session" element={<QuizSession />} />
          <Route path="/profile"             element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
