import { Link, useParams } from 'react-router-dom'
import Chip, { statusTone } from '../components/primitives'
import Avatar, { AvatarStack } from '../components/ui'
import { projects, videoReviews, projectInputs, team, activity } from '../lib/mockData'
import { statusLabel } from '../lib/format'
import { useViewer, can } from '../lib/viewer'

const memberOf = (id: string) => team.find((m) => m.id === id)

export default function ProjectDetailPage() {
  const { id } = useParams()
  const viewer = useViewer()
  const project = projects.find((p) => p.id === id) ?? projects[0]

  const review = videoReviews[project.id]
  const inputs = projectInputs[project.id] ?? []
  const versions = review?.versions ?? [
    { id: 'v1', label: 'v1.0', uploadedBy: project.assignee, uploadedAt: project.updated, summary: 'Initial draft' },
  ]
  const openComments = review?.comments.filter((c) => !c.resolved).length ?? 0
  const projectActivity = activity.filter((a) => a.project === project.id)

  const isInReview = ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED'].includes(project.status)
  const canComment = can(viewer, 'comment')
  const canUpload = can(viewer, 'upload')
  const canApprove = can(viewer, 'approve')

  return (
    <div className="fade-in space-y-6">
      {/* Breadcrumb + header */}
      <nav className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-umber/60">
        <Link to="/projects" className="hover:text-teal">Projects</Link>
        <span>/</span>
        <span className="text-ink">{project.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">{project.title}</h1>
            <Chip label={statusLabel(project.status)} tone={statusTone(project.status)} dot />
            <Chip label={project.type} tone="neutral" />
          </div>
          <p className="mt-1 text-sm text-umber">
            {memberOf(project.assignee)?.name} is responsible · updated {project.updated}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.status === 'PUBLISHED' && project.postUrl && (
            <a href={project.postUrl} target="_blank" rel="noreferrer" className="btn-secondary">
              View live post on {project.platform}
            </a>
          )}
          {review && (
            <Link to={`/projects/${project.id}/review`} className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5.5 4.6v4.8l4-2.4-4-2.4Z" fill="currentColor" />
              </svg>
              Open review workspace{openComments ? ` (${openComments})` : ''}
            </Link>
          )}
          {isInReview && canComment && !review && (
            <button className="btn-primary" title="Draft coming — editors upload the video here">Review draft</button>
          )}
          {canUpload && (
            <button className="btn-secondary" title="Upload a new cut of this video">Upload new version</button>
          )}
          {canApprove && !isInReview && project.status !== 'PUBLISHED' && (
            <button className="btn-secondary" title="Approval happens in the review workspace">Approve latest</button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-umber/70">Current version</p>
          <p className="mt-2 font-mono text-xl font-medium text-ink">{versions[0].label}</p>
          <p className="mt-0.5 text-xs text-umber">{memberOf(versions[0].uploadedBy)?.name} · {versions[0].uploadedAt}</p>
        </div>
        <div className="card p-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-umber/70">Approved version</p>
          <p className="mt-2 font-mono text-xl font-medium text-ink">{project.approvedVersion ?? '—'}</p>
          <p className="mt-0.5 text-xs text-umber">{project.approvedVersion ? 'Exact version locked for publishing' : 'Not approved yet'}</p>
        </div>
        <div className="card p-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-umber/70">Team</p>
          <div className="mt-3">
            <AvatarStack initials={[project.assignee, ...project.reviewers].map((u) => memberOf(u)?.initials ?? '?')} max={4} />
          </div>
        </div>
        <div className="card p-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-umber/70">{project.platform ? 'Published' : 'Schedule'}</p>
          {project.status === 'PUBLISHED' ? (
            <>
              <p className="mt-2 font-mono text-xl font-medium text-ink">{project.platform}</p>
              <p className="mt-0.5 text-xs text-umber">{project.publishedAt}</p>
            </>
          ) : (
            <>
              <p className="mt-2 font-mono text-xl font-medium text-ink">{project.scheduleDate ?? 'Not set'}</p>
              <p className="mt-0.5 text-xs text-umber">{project.status === 'SCHEDULED' ? 'Waiting to go live' : 'Approval required before scheduling'}</p>
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: description + inputs */}
        <div className="space-y-6 xl:col-span-2">
          <div className="card p-5">
            <h2 className="mb-3 font-headline text-base font-semibold tracking-tight text-ink">About this project</h2>
            <p className="text-sm leading-relaxed text-ink/80">{project.description}</p>
            <p className="mt-4 rounded-[8px] bg-canvas/70 px-3 py-2.5 text-xs text-umber">
              Proposed by {memberOf(project.creator)?.name} · reviewed by {project.reviewers.map((r) => memberOf(r)?.name).join(', ')}
            </p>
          </div>

          {/* Inputs */}
          <div className="card p-0">
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Required inputs</h2>
              {inputs.length > 0 && (
                <span className="font-mono text-[11px] text-umber/60">
                  {inputs.filter((i) => i.state === 'received').length}/{inputs.length} received
                </span>
              )}
            </header>
            {inputs.length ? (
              <ul className="divide-y divide-line">
                {inputs.map((inp) => (
                  <li key={inp.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${inp.state === 'received' ? 'bg-success/10 text-success' : inp.state === 'blocked' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                      {inp.state === 'received' ? '✓' : inp.state === 'blocked' ? '!' : '·'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{inp.title}</p>
                      <p className="text-xs text-umber">
                        {memberOf(inp.owner)?.name} · {inp.state === 'received' ? `received ${inp.receivedAt}` : `${inp.state} since ${inp.requestedAt}`}
                      </p>
                    </div>
                    <Chip label={inp.state} tone={inp.state === 'received' ? 'success' : inp.state === 'blocked' ? 'danger' : 'warning'} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-umber">No inputs tracked for this project yet.</p>
            )}
          </div>

          {/* Activity */}
          <div className="card p-0">
            <header className="border-b border-line px-5 py-4">
              <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Project history</h2>
            </header>
            {projectActivity.length ? (
              <ul className="divide-y divide-line">
                {projectActivity.map((a, i) => (
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
            ) : (
              <p className="px-5 py-8 text-center text-sm text-umber">No activity recorded yet.</p>
            )}
          </div>
        </div>

        {/* Versions timeline */}
        <div className="card h-fit p-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Versions</h2>
            {review && <Link to={`/projects/${project.id}/review`} className="text-xs font-medium text-teal hover:underline">Review draft</Link>}
          </header>
          <ol className="relative space-y-5 border-l border-line pl-5">
            {versions.map((v, i) => (
              <li key={v.id} className="relative">
                <span
                  className={`absolute -left-[25.5px] top-1 h-3 w-3 rounded-full border-2 border-surface ${i === 0 ? 'bg-teal' : 'bg-ink/20'}`}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-medium text-teal">{v.label}</span>
                  {i === 0 && <Chip label={project.approvedVersion === v.label ? 'Approved' : 'Latest'} tone={project.approvedVersion === v.label ? 'teal' : 'neutral'} />}
                </div>
                <p className="mt-1 text-sm leading-snug text-ink/80">{v.summary}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Avatar initials={memberOf(v.uploadedBy)?.initials ?? '?'} size="xs" tone="tint" />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{v.uploadedAt}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
