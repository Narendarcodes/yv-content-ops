import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import KanbanPage from './pages/KanbanPage'
import BriefsPage from './pages/BriefsPage'
import BriefDetailPage from './pages/BriefDetailPage'
import PublicationsPage from './pages/PublicationsPage'
import VersionsPage from './pages/VersionsPage'
import InputsPage from './pages/InputsPage'
import ActivityPage from './pages/ActivityPage'
import NotificationsPage from './pages/NotificationsPage'
import CommentsPage from './pages/CommentsPage'
import ChatPage from './pages/ChatPage'
import ContractsPage from './pages/ContractsPage'
import InvoicesPage from './pages/InvoicesPage'
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
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/kanban" element={<KanbanPage />} />
        <Route path="/briefs" element={<BriefsPage />} />
        <Route path="/briefs/:id" element={<BriefDetailPage />} />
        <Route path="/publications" element={<PublicationsPage />} />
        <Route path="/versions" element={<VersionsPage />} />
        <Route path="/inputs" element={<InputsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/comments" element={<CommentsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
