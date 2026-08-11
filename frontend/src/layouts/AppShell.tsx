import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Avatar from '../components/ui'
import { org, currentUser } from '../lib/mockData'

type NavItem = {
  to: string
  label: string
  icon: () => React.ReactNode
  end?: boolean
  badge?: number
}

export default function AppShell() {
  const navigate = useNavigate()

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
          {navGroups.map((group) => (
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
            <Avatar initials={currentUser.initials} size="md" tone="ink" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-ink">{currentUser.name}</p>
              <p className="text-[11px] text-umber">Admin</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-umber/50">
              <path d="M7 2.5v9M3.5 9L7 12.5 10.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-line bg-canvas/90 px-6 backdrop-blur">
          <p className="hidden text-[11px] font-mono uppercase tracking-wider text-umber/70 md:block">
            Dashboard / Overview
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
            <Avatar initials={currentUser.initials} size="sm" tone="ink" />
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
const FolderIcon = () =>
  baseIcon(
    <>
      <path d="M1.5 4.5A1.5 1.5 0 0 1 3 3h2.5l1.5 1.5H13A1.5 1.5 0 0 1 14.5 6v5.5A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5v-7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </>,
  )
const DocIcon = () =>
  baseIcon(
    <>
      <path d="M3 1.5h6l4 4v9H3v-13Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9 1.5v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </>,
  )
const BookIcon = () =>
  baseIcon(
    <>
      <path d="M8 3.5C6.5 2 4 2 1.5 2.5v10C4 12 6.5 12 8 13.5 9.5 12 12 12 14.5 12.5v-10C12 2 9.5 2 8 3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 3.5v10" stroke="currentColor" strokeWidth="1.3" />
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
const BranchIcon = () =>
  baseIcon(
    <>
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 6v2.5A2.5 2.5 0 0 0 6.5 11H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 6v.5A2.5 2.5 0 0 0 6.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>,
  )
const InboxIcon = () =>
  baseIcon(
    <>
      <path d="M2 9l2.5-6h7l2.5 6v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M2 9h3.5l1 2h3l1-2H14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </>,
  )
const BellIcon = () =>
  baseIcon(
    <>
      <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v3L2 11h12l-1.5-2V6A4.5 4.5 0 0 0 8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>,
  )
const CommentIcon = () =>
  baseIcon(
    <>
      <path d="M1.5 3A1.5 1.5 0 0 1 3 1.5h10A1.5 1.5 0 0 1 14.5 3v6A1.5 1.5 0 0 1 13 10.5H6l-4 3v-9.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </>,
  )
const ChatIcon = () =>
  baseIcon(
    <>
      <path d="M1.5 4A2 2 0 0 1 3.5 2h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5l-3.5 2.5V11h-.5a2 2 0 0 1-2-2V4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </>,
  )
const FileTextIcon = () =>
  baseIcon(
    <>
      <path d="M3 1.5h6l4 4v9H3v-13Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 8h4M6 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>,
  )
const CardIcon = () =>
  baseIcon(
    <>
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 6h13" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 9.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
    section: 'Projects',
    items: [
      { to: '/projects', label: 'Active Projects', icon: FolderIcon },
      { to: '/briefs', label: 'Briefs', icon: DocIcon },
      { to: '/publications', label: 'Publications', icon: BookIcon },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: '/projects/p1/kanban', label: 'Kanban Board', icon: ColumnsIcon },
      { to: '/versions', label: 'Versions', icon: BranchIcon },
      { to: '/inputs', label: 'Inputs', icon: InboxIcon },
    ],
  },
  {
    section: 'Comms',
    items: [
      { to: '/notifications', label: 'Notifications', icon: BellIcon, badge: 3 },
      { to: '/comments', label: 'Comments', icon: CommentIcon },
      { to: '/chat', label: 'Team Chat', icon: ChatIcon },
    ],
  },
  {
    section: 'Admin',
    items: [
      { to: '/contracts', label: 'Contracts', icon: FileTextIcon },
      { to: '/invoices', label: 'Invoices', icon: CardIcon },
      { to: '/members', label: 'Members', icon: UsersIcon },
      { to: '/settings', label: 'Settings', icon: GearIcon },
    ],
  },
]
