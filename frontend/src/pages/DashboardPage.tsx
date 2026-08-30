import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, CalendarClock, CheckSquare, Clapperboard,
  Eye, Inbox, Megaphone, MessageCircle, MessageSquare, Shield, Users,
} from 'lucide-react'
import Chip, { statusTone } from '../components/primitives'
import Avatar from '../components/ui'
import { StatCardSkeleton, ErrorBanner } from '../components/states'
import { type Project } from '../lib/types'
import { statusLabel } from '../lib/format'
import { useViewer } from '../lib/viewer'
import { roleOf, type Role } from '../lib/roles'
import { useTeam, useProjects, useReviews, useMe, primaryOrgId } from '../lib/data'
import { listOrgActivity } from '../services/api'
import { useEffect, useState } from 'react'

const iconProps = { size: 18, strokeWidth: 1.75 }

// Shared team reference so module-level components (ProjectRow, WorkCard,
// ActivityCard) can resolve member ids even though the team is loaded async.
let teamRef: ReturnType<typeof useTeam>['team'] = []
export function setTeamRef(t: typeof teamRef) {
  teamRef = t
}
const memberOf = (id: string) => teamRef.find((m) => m.id === id)

const REVIEW = ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED', 'REVISION_IN_PROGRESS']
const PRODUCTION = ['ASSIGNED', 'WAITING_FOR_INPUTS', 'INPUTS_READY', 'IN_PROGRESS', 'REVISION_REQUESTED']
const inReview = (p: Project) => REVIEW.includes(p.status)
const inProduction = (p: Project) => PRODUCTION.includes(p.status)

type StatTone = 'teal' | 'warning' | 'success' | 'neutral'
interface Stat {
  label: string
  value: number
  icon: ReactNode
  tone: StatTone
}

/* ---------- Shared building blocks ---------- */

function StatCard({ s }: { s: Stat }) {
  const toneClass =
    s.tone === 'teal'
      ? 'bg-tint text-teal'
      : s.tone === 'warning'
        ? 'bg-warning/10 text-warning'
        : s.tone === 'success'
          ? 'bg-success/10 text-success'
          : 'bg-ink/5 text-umber'
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-umber/70">{s.label}</p>
          <p className="mt-2 font-headline text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink">{s.value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>{s.icon}</span>
      </div>
    </div>
  )
}

function CardHeader({ title, to, action }: { title: string; to?: string; action?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4">
      <h2 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      {to ? (
        <Link to={to} className="group flex items-center gap-1 text-xs font-medium text-teal transition-opacity hover:opacity-80">
          {action ?? 'View all'}
          <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </header>
  )
}

function ProjectRow({ p, icon }: { p: Project; icon: ReactNode }) {
  const assignee = memberOf(p.assignee)
  return (
    <li>
      <Link
        to={`/projects/${p.id}`}
        className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas/60"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-umber transition-colors group-hover:bg-tint group-hover:text-teal">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{p.title}</p>
          <p className="truncate text-xs text-umber">
            {[assignee?.name ?? 'Unassigned', p.approvedVersion, p.updated].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} />
        <ArrowRight size={15} strokeWidth={1.75} className="text-umber/30 opacity-0 transition-[transform,opacity] group-hover:translate-x-0.5 group-hover:opacity-100" />
      </Link>
    </li>
  )
}

function ProjectListCard({
  title, to, action, icon, items, empty, className,
}: {
  title: string
  to?: string
  action?: string
  icon: ReactNode
  items: Project[]
  empty?: string
  className?: string
}) {
  return (
    <div className={`card overflow-hidden ${className ?? ''}`}>
      <CardHeader title={title} to={to} action={action} />
      {items.length ? (
        <ul className="divide-y divide-line">
          {items.map((p) => <ProjectRow key={p.id} p={p} icon={icon} />)}
        </ul>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-umber">{empty ?? 'Nothing here yet.'}</div>
      )}
    </div>
  )
}

function WorkCard({ p }: { p: Project }) {
  return (
    <Link to={`/projects/${p.id}`} className="card card-hover p-5">
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
  )
}

function ScheduledCard({ items, className }: { items: Project[]; className?: string }) {
  return (
    <div className={`card overflow-hidden ${className ?? ''}`}>
      <CardHeader title="Scheduled to publish" to="/schedule" action="Schedule" />
      <ul className="divide-y divide-line">
        {items.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas/50">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <CalendarClock {...iconProps} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{p.title}</p>
              <p className="truncate text-xs text-umber">{p.platform ?? '-'} · {p.scheduleDate ?? p.publishedAt ?? '-'}</p>
            </div>
          </li>
        ))}
        {!items.length && <li className="px-5 py-8 text-center text-sm text-umber">Nothing scheduled yet.</li>}
      </ul>
    </div>
  )
}

/** Human label for a backend activity action, shown on the dashboard feed. */
function describeAction(e: any): string {
  const m = e.metadata ?? {}
  switch (e.action) {
    case 'created': return 'created the project'
    case 'transitioned': return `moved it to ${m.to ?? 'a new stage'}`
    case 'version_uploaded': return `uploaded ${m.label ?? 'a new version'}`
    case 'comment_added': return 'commented on the draft'
    case 'revision_requested': return 'requested a revision'
    case 'approved': return `approved ${m.label ?? 'the draft'}`
    case 'scheduled': return 'scheduled it for publishing'
    case 'published': return 'published the project'
    case 'metric_recorded': return 'recorded metrics'
    case 'message_sent': return 'sent a chat message'
    case 'channel_created': return 'created a channel'
    default: return String(e.action).replace(/_/g, ' ')
  }
}

function ActivityCard() {
  // REAL events from the org-wide feed (/organizations/:id/activity), not
  // notifications. Falls back to a quiet empty state; never mock data.
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const orgId = await primaryOrgId()
        if (!orgId) { if (active) setLoading(false); return }
        const evts = await listOrgActivity(orgId, 8)
        if (active) setEvents(evts)
      } catch {
        /* backend unreachable — empty state below */
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  return (
    <div className="card overflow-hidden">
      <CardHeader title="Recent activity" />
      {loading ? (
        <div className="space-y-3 px-5 py-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse gap-3">
              <span className="h-9 w-9 rounded-xl bg-line/60" />
              <div className="flex-1 space-y-1.5">
                <span className="block h-3 w-3/4 rounded bg-line/60" />
                <span className="block h-2.5 w-1/3 rounded bg-line/40" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length ? (
        <ul className="divide-y divide-line">
          {events.map((e, i) => {
            const actor = e.actor?.name ?? 'Someone'
            const project = e.projectId?.title ?? 'a project'
            return (
              <li key={String(e.id)} className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-canvas/50">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${i % 2 ? 'bg-tint text-teal' : 'bg-ink/5 text-umber'}`}>
                  <Clapperboard {...iconProps} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-ink">
                    <span className="font-medium">{actor}</span> {describeAction(e)} · <span className="text-umber">{project}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-umber/60">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-umber">No activity recorded yet.</p>
      )}
    </div>
  )
}

function PublishedCard({ p }: { p: Project }) {
  return (
    <Link to={`/projects/${p.id}`} className="card card-hover p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{p.platform ?? 'Published'}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
          <Megaphone {...iconProps} />
        </span>
      </div>
      <h3 className="font-headline text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">{p.title}</h3>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{p.publishedAt ?? p.updated}</span>
        <Chip label="Published" tone="success" />
      </div>
    </Link>
  )
}

/* ---------- Page ---------- */

export default function DashboardPage() {
  const viewer = useViewer()
  const firstName = viewer.name.split(' ')[0]
  const info = roleOf(viewer)

  const { projects, loading: projectsLoading, error: projectsError } = useProjects()
  const { team, loading: teamLoading } = useTeam()
  setTeamRef(team)
  const me = useMe()
  const { reviews } = useReviews()

  // While the backend round-trip is in flight, show skeletons - never a
  // misleading "zero" state on slow connections.
  const loading = projectsLoading || teamLoading

  // My scope
  const myWork = projects.filter((p) => p.assignee === viewer.id && p.status !== 'PUBLISHED' && p.status !== 'CLOSED')
  const mineInReview = projects.filter((p) => p.assignee === viewer.id && inReview(p))
  const minePublished = projects.filter((p) => p.assignee === viewer.id && p.status === 'PUBLISHED')
  const myWaiting = projects.filter((p) => p.assignee === viewer.id && (p.status === 'WAITING_FOR_INPUTS' || p.status === 'INPUTS_READY'))

  // Org scope
  const allInReview = projects.filter(inReview)
  const production = projects.filter(inProduction)
  const approvedOrScheduled = projects.filter((p) => p.status === 'APPROVED' || p.status === 'SCHEDULED')
  const readyToPublish = projects.filter((p) => p.status === 'APPROVED')
  const waitingInputs = projects.filter((p) => p.status === 'WAITING_FOR_INPUTS' || p.status === 'INPUTS_READY')
  const publishedAll = projects.filter((p) => p.status === 'PUBLISHED')
  const sharedWithMe = projects.filter((p) => p.reviewers.includes(viewer.id) || p.creator === viewer.id)
  const scheduled = projects.filter((p) => p.status === 'SCHEDULED' || p.status === 'PUBLISHED')
  const myComments = reviews.filter((r) => r.author === me?.id).length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statsFor: Record<Role, Stat[]> = {
    admin: [
      { label: 'Awaiting review', value: allInReview.length, icon: <MessageSquare {...iconProps} />, tone: 'warning' },
      { label: 'In production', value: production.length, icon: <Clapperboard {...iconProps} />, tone: 'teal' },
      { label: 'Scheduled to publish', value: scheduled.length, icon: <CalendarClock {...iconProps} />, tone: 'success' },
      { label: 'Team members', value: team.length, icon: <Users {...iconProps} />, tone: 'neutral' },
    ],
    editor: [
      { label: 'My work', value: myWork.length, icon: <CheckSquare {...iconProps} />, tone: 'teal' },
      { label: 'In review', value: mineInReview.length, icon: <MessageSquare {...iconProps} />, tone: 'warning' },
      { label: 'Ready to start', value: myWaiting.length, icon: <Inbox {...iconProps} />, tone: 'neutral' },
      { label: 'Published', value: minePublished.length, icon: <Megaphone {...iconProps} />, tone: 'success' },
    ],
    designer: [
      { label: 'Awaiting your design', value: myWork.length, icon: <Clapperboard {...iconProps} />, tone: 'warning' },
      { label: 'In review', value: mineInReview.length, icon: <MessageSquare {...iconProps} />, tone: 'neutral' },
      { label: 'Waiting for inputs', value: waitingInputs.length, icon: <Inbox {...iconProps} />, tone: 'teal' },
      { label: 'Published', value: minePublished.length, icon: <Megaphone {...iconProps} />, tone: 'success' },
    ],
    reviewer: [
      { label: 'Awaiting review', value: allInReview.length, icon: <MessageSquare {...iconProps} />, tone: 'warning' },
      { label: 'Approved', value: approvedOrScheduled.length, icon: <BadgeCheck {...iconProps} />, tone: 'success' },
      { label: 'My comments', value: myComments, icon: <MessageCircle {...iconProps} />, tone: 'neutral' },
      { label: 'In production', value: production.length, icon: <Clapperboard {...iconProps} />, tone: 'teal' },
    ],
    publisher: [
      { label: 'Scheduled to publish', value: scheduled.length, icon: <CalendarClock {...iconProps} />, tone: 'success' },
      { label: 'Ready to publish', value: readyToPublish.length, icon: <BadgeCheck {...iconProps} />, tone: 'warning' },
      { label: 'Published', value: publishedAll.length, icon: <Megaphone {...iconProps} />, tone: 'neutral' },
      { label: 'In production', value: production.length, icon: <Clapperboard {...iconProps} />, tone: 'teal' },
    ],
    member: [
      { label: 'Shared with you', value: sharedWithMe.length, icon: <Eye {...iconProps} />, tone: 'teal' },
      { label: 'My comments', value: myComments, icon: <MessageCircle {...iconProps} />, tone: 'neutral' },
      { label: 'Awaiting review', value: allInReview.length, icon: <MessageSquare {...iconProps} />, tone: 'warning' },
      { label: 'Published', value: publishedAll.length, icon: <Megaphone {...iconProps} />, tone: 'success' },
    ],
  }

  const stats = statsFor[viewer.role]

  return (
    <div className="space-y-8">
      {/* Greeting + role identity */}
      <div className="stagger flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-umber">
            {viewer.role === 'admin'
              ? 'Here’s what the team is working on across your organization today.'
              : `Your ${info.desk.toLowerCase()} - ${info.blurb}`}
          </p>
        </div>
        <Link
          to="/profile"
          className="group flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 shadow-card transition-colors hover:border-line-strong"
        >
          <Shield size={13} strokeWidth={1.75} className="text-teal" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-umber">Viewing as</span>
          <span className="text-xs font-semibold text-ink">{info.label}</span>
          <ArrowRight size={12} strokeWidth={1.75} className="text-umber/40 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Stat cards */}
      {loading ? (
        <StatCardSkeleton count={4} />
      ) : projectsError ? (
        <ErrorBanner onRetry={() => window.location.reload()} />
      ) : (
        <section className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.length > 0 ? stats.map((s) => <StatCard key={s.label} s={s} />) : (
            <div className="py-10 text-center text-sm text-umber">No stats to display</div>
          )}
        </section>
      )}

      {/* ---------------- Admin: team overview ---------------- */}
      {viewer.role === 'admin' && (
        <>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ProjectListCard
              className="xl:col-span-2"
              title="Awaiting review"
              to="/review"
              action="Open review"
              icon={<MessageSquare {...iconProps} />}
              items={allInReview}
              empty="Nothing waiting on you right now."
            />
            <div className="space-y-6">
              <ScheduledCard items={scheduled} />
              <ActivityCard />
            </div>
          </section>
          {myWork.length > 0 && (
            <section>
              <header className="mb-3 flex items-center justify-between">
                <h2 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">Your work</h2>
                <Link to="/my-work" className="group flex items-center gap-1 text-xs font-medium text-teal transition-opacity hover:opacity-80">
                  All my work
                  <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </header>
              <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {myWork.slice(0, 3).map((p) => <WorkCard key={p.id} p={p} />)}
              </div>
            </section>
          )}
        </>
      )}

      {/* ---------------- Editor: production desk ---------------- */}
      {viewer.role === 'editor' && (
        <>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="card overflow-hidden xl:col-span-2">
              <CardHeader title="My work" to="/my-work" action="All my work" />
              {myWork.length ? (
                <div className="stagger grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  {myWork.slice(0, 4).map((p) => <WorkCard key={p.id} p={p} />)}
                </div>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-umber">Nothing on your desk right now.</div>
              )}
            </div>
            <div className="space-y-6">
              <ProjectListCard
                title="In review - my submissions"
                icon={<MessageSquare {...iconProps} />}
                items={mineInReview}
                empty="Nothing of yours is in review."
              />
              <ActivityCard />
            </div>
          </section>
          {myWaiting.length > 0 && (
            <ProjectListCard
              title="Ready to start"
              to="/my-work"
              action="All my work"
              icon={<Inbox {...iconProps} />}
              items={myWaiting}
              empty=""
            />
          )}
        </>
      )}

      {/* ---------------- Designer: design desk ---------------- */}
      {viewer.role === 'designer' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ProjectListCard
            className="xl:col-span-2"
            title="Awaiting your design"
            to="/my-work"
            action="All my work"
            icon={<Clapperboard {...iconProps} />}
            items={myWork}
            empty="Nothing is waiting on your desk."
          />
          <div className="space-y-6">
            {mineInReview.length > 0 && (
              <ProjectListCard title="In review" icon={<MessageSquare {...iconProps} />} items={mineInReview} />
            )}
            <ActivityCard />
          </div>
        </section>
      )}

      {/* ---------------- Reviewer: review desk ---------------- */}
      {viewer.role === 'reviewer' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ProjectListCard
            className="xl:col-span-2"
            title="Awaiting your review"
            to="/review"
            action="Open review"
            icon={<MessageSquare {...iconProps} />}
            items={allInReview}
            empty="Nothing waiting on you right now."
          />
          <div className="space-y-6">
            <ProjectListCard
              title="Recently approved"
              icon={<BadgeCheck {...iconProps} />}
              items={approvedOrScheduled}
              empty="No approvals yet."
            />
            <ActivityCard />
          </div>
        </section>
      )}

      {/* ---------------- Publisher: publishing desk ---------------- */}
      {viewer.role === 'publisher' && (
        <>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ScheduledCard items={scheduled} className="xl:col-span-2" />
            <div className="space-y-6">
              <ProjectListCard
                title="Ready to publish"
                to="/schedule"
                action="Go to schedule"
                icon={<BadgeCheck {...iconProps} />}
                items={readyToPublish}
                empty="No approved projects waiting to go live."
              />
              <ActivityCard />
            </div>
          </section>
          <section>
            <header className="mb-3 flex items-center justify-between">
              <h2 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">Recently published</h2>
              <Link to="/projects" className="group flex items-center gap-1 text-xs font-medium text-teal transition-opacity hover:opacity-80">
                All projects
                <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </header>
            {publishedAll.length ? (
              <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {publishedAll.slice(0, 3).map((p) => <PublishedCard key={p.id} p={p} />)}
              </div>
            ) : (
              <div className="card p-8 text-center text-sm text-umber">Nothing published yet.</div>
            )}
          </section>
        </>
      )}

      {/* ---------------- Member: read-only workspace ---------------- */}
      {viewer.role === 'member' && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ProjectListCard
            className="xl:col-span-2"
            title="Shared with you"
            to="/projects"
            action="All projects"
            icon={<Eye {...iconProps} />}
            items={sharedWithMe}
            empty="Nothing has been shared with you yet."
          />
          <div className="space-y-6">
            <ActivityCard />
          </div>
        </section>
      )}
    </div>
  )
}
