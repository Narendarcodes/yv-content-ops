import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MyWorkPage from './pages/MyWorkPage'
import ReviewPage from './pages/ReviewPage'
import BoardPage from './pages/BoardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ReviewWorkspacePage from './pages/ReviewWorkspacePage'
import ConceptsPage from './pages/ConceptsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SchedulePublishPage from './pages/SchedulePublishPage'
import NotificationsPage from './pages/NotificationsPage'
import ChatPage from './pages/ChatPage'
import MembersPage from './pages/MembersPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated app shell */}
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/my-work" element={<MyWorkPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/review" element={<ReviewWorkspacePage />} />
        <Route path="/concepts" element={<ConceptsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/schedule" element={<SchedulePublishPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
