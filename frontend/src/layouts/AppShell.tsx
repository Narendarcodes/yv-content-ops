import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Avatar from '../components/ui'
import { org, team, projects, notifications } from '../lib/mockData'
import { useViewer, switchViewer } from '../lib/viewer'

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
  const segments = location.pathname.split('/').filter(Boolean)
  const crumb = CRUMBS[segments[0] ?? ''] ?? 'Overview'

  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(viewer.role)) }))
    .filter((g) => g.items.length > 0)

  // Live badge counts, consistent with Dashboard/Review pages
  const inReview = (s: string) => ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED'].includes(s)
  const reviewCount =
    viewer.role === 'admin' || viewer.role === 'reviewer'
      ? projects.filter((p) => inReview(p.status)).length
      : projects.filter((p) => inReview(p.status) && p.reviewers.includes(viewer.id)).length
  const unreadCount = notifications.filter((n) => n.unread).length

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
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-teal font-headline text-sm font-bold text-on-accent">
            Aa
          </span>
          <div className="leading-tight">
            <p className="font-headline text-base font-bold tracking-tight text-ink">Aaryajanani</p>
            <p className="flex items-center gap-1 text-[11px] text-umber">
              {org.name}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-umber/60">
                <path d="M2.5 3.5L5 6l2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </p>
          </div>
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
                    {item.badge && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 text-[10px] font-mono text-on-accent">
                        {item.badge}
                      </span>
                    )}
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
            className="flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left hover:bg-ink/4 transition-colors"
          >
            <Avatar initials={viewer.initials} size="md" tone="ink" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-ink">{viewer.name}</p>
              <p className="text-[11px] text-umber">{viewer.title}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-umber/50">
              <path d="M7 2.5v9M3.5 9L7 12.5 10.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <label className="mt-1.5 block px-2">
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-umber/60">View as (demo)</span>
            <select
              value={viewer.id}
              onChange={(e) => switchViewer(e.target.value)}
              className="input !h-8 w-full !px-2 text-xs"
              aria-label="Switch role"
            >
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-line bg-canvas/90 px-6 backdrop-blur">
          <p className="hidden text-[11px] font-mono uppercase tracking-wider text-umber/70 md:block">
            {crumb}
          </p>
          <div className="relative ml-auto w-64">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-umber/60"
            >
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search…"
              className="input !pl-9 !h-9"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[9px] text-umber/60">
              ⌘K
            </kbd>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-[8px] text-umber hover:bg-ink/4 hover:text-ink transition-colors"
            aria-label="Notifications"
          >
            <BellIcon />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-canvas" aria-hidden="true" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="rounded-full transition-transform active:scale-95"
            aria-label="Profile"
          >
            <Avatar initials={viewer.initials} size="sm" tone="ink" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-6 md:px-8">
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

/* ---------- Icons ---------- */
function baseIcon(paths: React.ReactNode) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      {paths}
    </svg>
  )
}
const DashboardIcon = () =>
  baseIcon(
    <>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    </>,
  )
const MyWorkIcon = () =>
  baseIcon(
    <>
      <path d="M2.5 3h11M2.5 3A1.5 1.5 0 0 0 1 4.5v8A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 13.5 3M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m5.5 9.5 2 2 3-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  )
const ReviewIcon = () =>
  baseIcon(
    <>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 5.4v5.2l4.5-2.6-4.5-2.6Z" fill="currentColor" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
    </>,
  )
const ColumnsIcon = () =>
  baseIcon(
    <>
      <rect x="1.5" y="2" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6.25" y="2" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="11" y="2" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </>,
  )
const FolderIcon = () =>
  baseIcon(
    <>
      <path d="M1.5 4.5A1.5 1.5 0 0 1 3 3h2.5l1.5 1.5H13A1.5 1.5 0 0 1 14.5 6v5.5A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5v-7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </>,
  )
const ConceptIcon = () =>
  baseIcon(
    <>
      <path d="M8 1.5 9.5 5l3.5.8-2.6 2.5.7 3.7L8 10.2 4.9 12l.7-3.7L3 5.8 6.5 5 8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </>,
  )
const AnalyticsIcon = () =>
  baseIcon(
    <>
      <path d="M2.5 13.5v-3M6.5 13.5V6M10.5 13.5V3M14 13.5H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>,
  )
const ScheduleIcon = () =>
  baseIcon(
    <>
      <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 6.5h13M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 10.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  )
const BellIcon = () =>
  baseIcon(
    <>
      <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v3L2 11h12l-1.5-2V6A4.5 4.5 0 0 0 8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>,
  )
const ChatIcon = () =>
  baseIcon(
    <>
      <path d="M1.5 4A2 2 0 0 1 3.5 2h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5l-3.5 2.5V11h-.5a2 2 0 0 1-2-2V4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </>,
  )
const UsersIcon = () =>
  baseIcon(
    <>
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 13.5c0-2.5 1.8-4 4-4s4 1.5 4 4M9.5 13.5c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>,
  )
const GearIcon = () =>
  baseIcon(
    <>
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>,
  )

const navGroups: { section: string; items: NavItem[] }[] = [
  {
    section: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: DashboardIcon, end: true }],
  },
  {
    section: 'Work',
    items: [
      { to: '/my-work', label: 'My work', icon: MyWorkIcon },
      { to: '/review', label: 'Review', icon: ReviewIcon, roles: ['admin', 'reviewer'] },
      { to: '/board', label: 'Board', icon: ColumnsIcon },
    ],
  },
  {
    section: 'Projects',
    items: [
      { to: '/projects', label: 'Projects', icon: FolderIcon },
      { to: '/concepts', label: 'Concepts', icon: ConceptIcon, roles: ['admin', 'editor', 'designer', 'reviewer'] },
      { to: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
    ],
  },
  {
    section: 'Launch',
    items: [
      {
        to: '/schedule',
        label: 'Schedule & Publish',
        icon: ScheduleIcon,
        tag: 'Soon',
        roles: ['admin', 'publisher', 'editor', 'designer'],
      },
    ],
  },
  {
    section: 'Comms',
    items: [
      { to: '/notifications', label: 'Notifications', icon: BellIcon },
      { to: '/chat', label: 'Team chat', icon: ChatIcon },
    ],
  },
  {
    section: 'Admin',
    items: [
      { to: '/members', label: 'Members', icon: UsersIcon, roles: ['admin'] },
      { to: '/settings', label: 'Settings', icon: GearIcon, roles: ['admin'] },
    ],
  },
]
