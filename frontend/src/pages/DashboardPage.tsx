import { Link } from 'react-router-dom'
import Chip, { statusTone } from '../components/primitives'
import Avatar from '../components/ui'
import { projects, scheduledPosts, activity, dashboardStats, team, type Project } from '../lib/mockData'
import { statusLabel } from '../lib/format'
import { useViewer } from '../lib/viewer'

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const ReviewIco = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="m10 8.5 5 3.5-5 3.5v-7Z" /></svg>
)
const WorkIco = () => (
  <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="m8 12 2.5 2.5L16 9" /></svg>
)
const InputIco = () => (
  <svg {...iconProps}><path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" /><path d="M4 8h16M4 8l3-3M20 8l-3-3" /></svg>
)
const ScheduleIco = () => (
  <svg {...iconProps}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" /><path d="m9 15 2 2 4-4" /></svg>
)

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
    { label: 'Awaiting review', value: reviewQueue.length, icon: <ReviewIco />, tone: 'warning' as const },
    { label: 'My work', value: myWork.length, icon: <WorkIco />, tone: 'teal' as const },
    { label: 'Waiting for inputs', value: dashboardStats.waitingInputs, icon: <InputIco />, tone: 'neutral' as const },
    { label: 'Scheduled to publish', value: dashboardStats.scheduled, icon: <ScheduleIco />, tone: 'success' as const },
  ]

  return (
    <div className="fade-in space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Good morning, {firstName}</h1>
        <p className="mt-1 text-sm text-umber">
          {viewer.role === 'admin'
            ? 'Here’s what the team is working on across Aaryajanani today.'
            : viewer.role === 'reviewer'
              ? 'Here’s what’s waiting for your review and approval.'
              : 'Here’s what’s on your plate today.'}
        </p>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-umber/70">{s.label}</p>
                <p className="mt-2 font-mono text-3xl font-medium text-ink">{s.value}</p>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${
                s.tone === 'teal' ? 'bg-tint text-teal' : s.tone === 'warning' ? 'bg-warning/10 text-warning' : s.tone === 'success' ? 'bg-success/10 text-success' : 'bg-ink/5 text-umber'
              }`}>{s.icon}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Review queue */}
        <div className="card p-0 xl:col-span-2">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Awaiting your review</h2>
            <Link to="/review" className="text-xs font-medium text-teal hover:underline">Open review</Link>
          </header>
          {reviewQueue.length ? (
            <ul className="divide-y divide-line">
              {reviewQueue.map((p) => (
                <li key={p.id}>
                  <Link to={`/projects/${p.id}/review`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas/60">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-ink/5 text-umber">
                      <ReviewIco />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                      <p className="truncate text-xs text-umber">
                        {memberOf(p.assignee)?.name} · {p.approvedVersion ? `${p.approvedVersion} · ` : ''}{p.updated}
                      </p>
                    </div>
                    <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} />
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
          <div className="card p-0">
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Scheduled to publish</h2>
              <Link to="/schedule" className="text-xs font-medium text-teal hover:underline">Schedule</Link>
            </header>
            <ul className="divide-y divide-line">
              {scheduledPosts.map((sp) => {
                return (
                  <li key={sp.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-success/10 text-success">
                      <ScheduleIco />
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
          <div className="card p-0">
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Recent activity</h2>
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
          <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Your work</h2>
          <Link to="/my-work" className="text-xs font-medium text-teal hover:underline">All my work</Link>
        </header>
        {myWork.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {myWork.slice(0, 3).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-pop">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{p.type}</span>
                  <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} />
                </div>
                <h3 className="font-headline text-[15px] font-semibold leading-snug tracking-tight text-ink">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-umber">{p.description}</p>
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
