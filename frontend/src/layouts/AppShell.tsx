import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  ListTodo,
  MessageSquare,
  MessageCircle,
  Columns3,
  FolderKanban,
  Lightbulb,
  BarChart3,
  CalendarClock,
  Bell,
  Users,
  Settings,
  Search,
  ChevronsUpDown,
  LogOut,
} from 'lucide-react'
import Avatar from '../components/ui'
import { useViewer } from '../lib/viewer'
import { logout, useAuth } from '../lib/auth'
import { useNotifications, refreshNotifications } from '../lib/notifications'
import { useProjects } from '../lib/data'
import CommandPalette from '../components/CommandPalette'
import BrandLogo from '../components/BrandLogo'


const iconProps = { size: 17, strokeWidth: 1.75 }

type NavItem = {
  to: string
  label: string
  icon: () => React.ReactNode
  end?: boolean
  badge?: number
  roles?: string[]
  tag?: string
}

const CRUMBS: Record<string, string> = {
  '': 'Overview',
  projects: 'Projects',
  'my-work': 'My work',
  review: 'Review',
  board: 'Board',
  concepts: 'Concepts',
  analytics: 'Analytics',
  schedule: 'Schedule & Publish',
  chat: 'Team chat',
  notifications: 'Notifications',
  members: 'Members',
  settings: 'Settings',
  profile: 'Profile',
}

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const viewer = useViewer()
  const { session } = useAuth()
  const notifs = useNotifications()
  const { projects } = useProjects()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const segments = location.pathname.split('/').filter(Boolean)
  const crumb = CRUMBS[segments[0] ?? ''] ?? 'Overview'

  // Global ⌘K / Ctrl+K - open the command palette from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fetch notifications from the backend on mount
  useEffect(() => {
    void refreshNotifications()
  }, [])

  // The viewer is the authenticated session user (RequireAuth guarantees a
  // session; this guards the brief moment before the hook hydrates).
  if (!viewer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-umber">Loading your workspace…</p>
      </div>
    )
  }

  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(viewer.role)) }))
    .filter((g) => g.items.length > 0)

  // Live badge counts, consistent with Dashboard/Review pages
  const inReview = (s: string) => ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED'].includes(s)
  const reviewCount =
    viewer.role === 'admin' || viewer.role === 'reviewer'
      ? projects.filter((p) => inReview(p.status)).length
      : projects.filter((p) => inReview(p.status) && p.reviewers.includes(viewer.id)).length
  const unreadCount = notifs.filter((n) => n.unread).length

  const groups = visibleGroups.map((g) => ({
    ...g,
    items: g.items.map((i) => {
      if (i.to === '/review') return { ...i, badge: reviewCount }
      if (i.to === '/notifications') return { ...i, badge: unreadCount }
      return i
    }),
  }))

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ---------- Sidebar ---------- */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-canvas">
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <BrandLogo to="/dashboard" size={36} />
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.section}>
              <p className="nav-section">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <item.icon />
                    <span className="flex-1">{item.label}</span>
                    {item.tag && (
                      <span className="rounded-full bg-warning/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-warning">
                        {item.tag}
                      </span>
                    )}
                    {item.badge ? (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-teal px-1 font-mono text-[10px] font-medium text-on-accent shadow-[0_1px_2px_rgba(15,118,110,0.35)]">
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-line p-3">
          <button
            onClick={() => navigate('/profile')}
            className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-ink/4"
          >
            {(() => { const src = (viewer as any).photoUrl || (viewer as any).profileImage; const apiBase = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'; const url = src ? (src.startsWith('http') ? src : `${apiBase.replace(/\/api\/v1\/?$/, '')}${src}`) : null; return <Avatar initials={viewer.initials} size="md" tone="ink" src={url} /> })()}
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-ink">{viewer.name}</p>
              <p className="truncate text-[11px] text-umber">{viewer.title}</p>
            </div>
            <ChevronsUpDown size={14} strokeWidth={2} className="text-umber/40 transition-transform group-hover:text-umber/70" />
          </button>
          <div className="mt-1.5 flex items-center gap-2 border-t border-line px-2 pt-2.5">
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-mono text-[9px] uppercase tracking-wider text-umber/60">Signed in as</p>
              <p className="truncate text-[11px] text-ink/70">{session?.user.email ?? viewer.email}</p>
            </div>
            <button
              onClick={async () => {
                await logout()
                navigate('/login', { replace: true })
              }}
              className="icon-btn icon-btn-sm"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-line bg-canvas/85 px-6 backdrop-blur-md md:px-8">
          <p className="hidden items-center text-[11px] font-mono uppercase tracking-wider text-umber/70 md:flex">
            {crumb}
          </p>
          <div className="relative ml-auto w-64">
            <Search
              size={15}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-umber/60"
            />
            <input
              placeholder="Search projects…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (!paletteOpen) setPaletteOpen(true)
              }}
              onFocus={() => setPaletteOpen(true)}
              onClick={() => setPaletteOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setPaletteOpen(true)
                }
                if (e.key === 'Escape') {
                  setSearchQuery('')
                }
              }}
              name="search"
              type="search"
              autoComplete="off"
              spellCheck={false}
              inputMode="search"
              className="input !h-9 !pl-9 cursor-text touch-manipulation focus-visible:ring-2 focus-visible:ring-teal/20 focus-visible:ring-offset-0"
              aria-label="Search projects"
              aria-expanded={paletteOpen}
              aria-haspopup="dialog"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-line bg-canvas px-1.5 py-0.5 font-mono text-[9px] text-umber/60">
              ⌘K
            </kbd>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="icon-btn touch-manipulation focus-visible:ring-2 focus-visible:ring-teal/20"
            aria-label="Notifications"
            data-testid="notifications-button"
          >
            <span className="relative inline-flex">
              <Bell size={17} strokeWidth={1.75} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="ping-dot absolute right-[-2px] top-[-2px] h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
              )}
            </span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="rounded-full ring-2 ring-transparent transition-[box-shadow,transform] hover:ring-teal/40 active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-teal/20"
            aria-label="Profile"
          >
            {(() => { const src = (viewer as any).photoUrl || (viewer as any).profileImage; const apiBase = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'; const url = src ? (src.startsWith('http') ? src : `${apiBase.replace(/\/api\/v1\/?$/, '')}${src}`) : null; return <Avatar initials={viewer.initials} size="sm" tone="ink" src={url} /> })()}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-7 md:px-8">
          <div className="page-enter mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global command palette */}
      <CommandPalette open={paletteOpen} initialQuery={searchQuery} onClose={() => { setPaletteOpen(false); setSearchQuery('') }} />
    </div>
  )
}

const navGroups: { section: string; items: NavItem[] }[] = [
  {
    section: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: () => <LayoutGrid {...iconProps} />, end: true }],
  },
  {
    section: 'Work',
    items: [
      { to: '/my-work', label: 'My work', icon: () => <ListTodo {...iconProps} /> },
      { to: '/review', label: 'Review', icon: () => <MessageSquare {...iconProps} />, roles: ['admin', 'reviewer'] },
      { to: '/board', label: 'Board', icon: () => <Columns3 {...iconProps} /> },
    ],
  },
  {
    section: 'Projects',
    items: [
      { to: '/projects', label: 'Projects', icon: () => <FolderKanban {...iconProps} /> },
      { to: '/concepts', label: 'Concepts', icon: () => <Lightbulb {...iconProps} />, roles: ['admin', 'editor', 'designer', 'reviewer'] },
      { to: '/analytics', label: 'Analytics', icon: () => <BarChart3 {...iconProps} /> },
    ],
  },
  {
    section: 'Launch',
    items: [
      {
        to: '/schedule',
        label: 'Schedule & Publish',
        icon: () => <CalendarClock {...iconProps} />,
        tag: 'Soon',
        roles: ['admin', 'publisher', 'editor', 'designer'],
      },
    ],
  },
  {
    section: 'Comms',
    items: [
      { to: '/notifications', label: 'Notifications', icon: () => <Bell {...iconProps} /> },
      { to: '/chat', label: 'Team chat', icon: () => <MessageCircle {...iconProps} /> },
    ],
  },
  {
    section: 'Admin',
    items: [
      { to: '/members', label: 'Members', icon: () => <Users {...iconProps} />, roles: ['admin'] },
      { to: '/settings', label: 'Settings', icon: () => <Settings {...iconProps} />, roles: ['admin'] },
    ],
  },
]
