import { Link } from 'react-router-dom'
import { PlayCircle } from 'lucide-react'
import Chip, { statusTone, PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { useProjects, useReviews, useTeam } from '../lib/data'
import { statusLabel } from '../lib/format'

const IN_REVIEW = ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED']

export default function ReviewPage() {
  const { projects } = useProjects()
  const { reviews } = useReviews()
  const { team } = useTeam()

  const memberOf = (id: string) => team.find((m) => m.id === id)

  // Surface projects that are in a review lifecycle state, or that already
  // carry review comments (so published items with feedback threads still show).
  const queue = projects.filter(
    (p) =>
      IN_REVIEW.includes(p.status) ||
      reviews.some((r) => r.projectId === p.id),
  )

  return (
    <div className="fade-in space-y-8">
      <PageHeader
        title="Review"
        subtitle="Drafts and published pieces with review threads. Open a project to read the feedback and resolve comments."
      />

      {queue.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {queue.map((p) => {
            const thread = reviews.filter((r) => r.projectId === p.id)
            const open = thread.filter((c) => !c.resolved).length
            return (
              <Link key={p.id} to={`/projects/${p.id}/review`} className="card overflow-hidden transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-pop">
                {/* Video thumbnail placeholder */}
                <div className="relative flex h-36 items-center justify-center bg-ink text-on-accent/70">
                  <PlayCircle size={40} strokeWidth={1.25} />
                  <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                    {thread.length ? `${thread.length} comment${thread.length === 1 ? '' : 's'}` : 'no draft'}
                  </span>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} dot />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{p.updated}</span>
                  </div>
                  <h3 className="font-headline text-[15px] font-semibold leading-snug tracking-tight text-ink">{p.title}</h3>
                  <p className="mt-1 text-xs text-umber">
                    {thread.length
                      ? `${open} open · ${thread.length - open} resolved`
                      : 'No review thread yet'}
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
          <p className="text-sm text-umber">You’re all caught up - nothing waiting for review.</p>
        </div>
      )}
    </div>
  )
}
