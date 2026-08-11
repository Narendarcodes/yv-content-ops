import { Link } from 'react-router-dom'
import Chip, { statusTone, PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { projects, videoReviews, team } from '../lib/mockData'
import { statusLabel } from '../lib/format'
import { useViewer } from '../lib/viewer'

const memberOf = (id: string) => team.find((m) => m.id === id)

const inReview = (p: (typeof projects)[number]) =>
  ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED'].includes(p.status)

export default function ReviewPage() {
  const viewer = useViewer()
  const queue =
    viewer.role === 'admin' || viewer.role === 'reviewer'
      ? projects.filter(inReview)
      : projects.filter((p) => inReview(p) && p.reviewers.includes(viewer.id))

  return (
    <div className="fade-in space-y-8">
      <PageHeader
        title="Review"
        subtitle="Drafts waiting on your feedback. Watch the video in the workspace, leave comments at exact moments, then approve or request changes."
      />

      {queue.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {queue.map((p) => {
            const review = videoReviews[p.id]
            const open = review?.comments.filter((c) => !c.resolved).length ?? 0
            return (
              <Link key={p.id} to={`/projects/${p.id}/review`} className="card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-pop">
                {/* Video thumbnail placeholder */}
                <div className="relative flex h-36 items-center justify-center bg-ink text-on-accent/70">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" />
                  </svg>
                  <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                    {review?.fileName ?? 'no draft'}
                  </span>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} dot />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{p.updated}</span>
                  </div>
                  <h3 className="font-headline text-[15px] font-semibold leading-snug tracking-tight text-ink">{p.title}</h3>
                  <p className="mt-1 text-xs text-umber">
                    {review ? `${review.versions[0].label} · ${open} open comment${open === 1 ? '' : 's'}` : 'No video draft yet'}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Avatar initials={memberOf(p.assignee)?.initials ?? '?'} size="xs" tone="tint" />
                    <span className="text-xs text-umber">by {memberOf(p.assignee)?.name}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-sm text-umber">You’re all caught up — nothing waiting for review.</p>
        </div>
      )}
    </div>
  )
}
