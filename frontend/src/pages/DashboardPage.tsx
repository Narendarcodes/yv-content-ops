import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, CheckSquare, Inbox, MessageSquare } from 'lucide-react'
import Chip, { statusTone } from '../components/primitives'
import Avatar from '../components/ui'
import { projects, scheduledPosts, activity, dashboardStats, team, type Project } from '../lib/mockData'
import { statusLabel } from '../lib/format'
import { useViewer } from '../lib/viewer'

const iconProps = { size: 18, strokeWidth: 1.75 }

const memberOf = (id: string) => team.find((m) => m.id === id)

const inReview = (p: Project) =>
  ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED'].includes(p.status)

export default function DashboardPage() {
  const viewer = useViewer()
  const firstName = viewer.name.split(' ')[0]

  // Awaiting your review: reviewer/admin see everything in review; others see only where they are a reviewer
  const reviewQueue =
    viewer.role === 'admin' || viewer.role === 'reviewer'
      ? projects.filter(inReview)
      : projects.filter((p) => inReview(p) && p.reviewers.includes(viewer.id))

  // My work: assigned to me
  const myWork = projects.filter((p) => p.assignee === viewer.id && p.status !== 'PUBLISHED' && p.status !== 'CLOSED')

  const stats = [
    { label: 'Awaiting review', value: reviewQueue.length, icon: <MessageSquare {...iconProps} />, tone: 'warning' as const },
    { label: 'My work', value: myWork.length, icon: <CheckSquare {...iconProps} />, tone: 'teal' as const },
    { label: 'Waiting for inputs', value: dashboardStats.waitingInputs, icon: <Inbox {...iconProps} />, tone: 'neutral' as const },
    { label: 'Scheduled to publish', value: dashboardStats.scheduled, icon: <CalendarClock {...iconProps} />, tone: 'success' as const },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="stagger">
        <div>
          <h1 className="font-headline text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-umber">
            {viewer.role === 'admin'
              ? 'Here’s what the team is working on across Aaryajanani today.'
              : viewer.role === 'reviewer'
                ? 'Here’s what’s waiting for your review and approval.'
                : 'Here’s what’s on your plate today.'}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <section className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card card-hover p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-umber/70">{s.label}</p>
                <p className="mt-2 font-headline text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink">{s.value}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                s.tone === 'teal' ? 'bg-tint text-teal' : s.tone === 'warning' ? 'bg-warning/10 text-warning' : s.tone === 'success' ? 'bg-success/10 text-success' : 'bg-ink/5 text-umber'
              }`}>{s.icon}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Review queue */}
        <div className="card overflow-hidden xl:col-span-2">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">Awaiting your review</h2>
            <Link to="/review" className="group flex items-center gap-1 text-xs font-medium text-teal transition-opacity hover:opacity-80">
              Open review
              <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </header>
          {reviewQueue.length ? (
            <ul className="divide-y divide-line">
              {reviewQueue.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/projects/${p.id}/review`}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas/60"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-umber transition-colors group-hover:bg-tint group-hover:text-teal">
                      <MessageSquare {...iconProps} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                      <p className="truncate text-xs text-umber">
                        {memberOf(p.assignee)?.name} · {p.approvedVersion ? `${p.approvedVersion} · ` : ''}{p.updated}
                      </p>
                    </div>
                    <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} />
                    <ArrowRight size={15} strokeWidth={1.75} className="text-umber/30 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-umber">Nothing waiting on you right now.</div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Scheduled posts */}
          <div className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">Scheduled to publish</h2>
              <Link to="/schedule" className="group flex items-center gap-1 text-xs font-medium text-teal transition-opacity hover:opacity-80">
                Schedule
                <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </header>
            <ul className="divide-y divide-line">
              {scheduledPosts.map((sp) => {
                return (
                  <li key={sp.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas/50">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                      <CalendarClock {...iconProps} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{sp.title}</p>
                      <p className="truncate text-xs text-umber">{sp.platform} · {sp.scheduledAt}</p>
                    </div>
                  </li>
                )
              })}
              {!scheduledPosts.length && <li className="px-5 py-8 text-center text-sm text-umber">Nothing scheduled yet.</li>}
            </ul>
          </div>

          {/* Recent activity */}
          <div className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">Recent activity</h2>
            </header>
            <ul className="divide-y divide-line">
              {activity.slice(0, 4).map((a, i) => (
                <li key={i} className="flex gap-3 px-5 py-3.5">
                  <Avatar initials={memberOf(a.actor)?.initials ?? '?'} size="sm" tone={i % 2 ? 'tint' : 'teal'} />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-ink">
                      <span className="font-medium">{memberOf(a.actor)?.name}</span> {a.verb}{' '}
                      <span className="font-medium text-teal">{a.target}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-umber/60">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* My work */}
      <section>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">Your work</h2>
          <Link to="/my-work" className="group flex items-center gap-1 text-xs font-medium text-teal transition-opacity hover:opacity-80">
            All my work
            <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </header>
        {myWork.length ? (
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {myWork.slice(0, 3).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card card-hover p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{p.type}</span>
                  <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} />
                </div>
                <h3 className="font-headline text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">{p.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-umber">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <Avatar initials={memberOf(p.assignee)?.initials ?? '?'} size="xs" tone="tint" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{p.updated}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-sm text-umber">No active work assigned to you.</div>
        )}
      </section>
    </div>
  )
}
