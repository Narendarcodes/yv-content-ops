import { Link } from 'react-router-dom'
import { ArrowRight, FolderKanban } from 'lucide-react'
import Chip, { statusTone, PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { statusLabel } from '../lib/format'
import { useProjects, useTeam, useMe } from '../lib/data'

const GROUPS: { key: string; label: string; hint: string; statuses: string[] }[] = [
  { key: 'active', label: 'In production', hint: 'Being produced', statuses: ['ASSIGNED', 'WAITING_FOR_INPUTS', 'INPUTS_READY', 'IN_PROGRESS'] },
  { key: 'review', label: 'In review', hint: 'Waiting on feedback', statuses: ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'REVISION_IN_PROGRESS', 'REVISION_SUBMITTED'] },
  { key: 'approved', label: 'Approved', hint: 'Ready to publish', statuses: ['APPROVED', 'SCHEDULED'] },
]

export default function MyWorkPage() {
  const { projects } = useProjects()
  const { team } = useTeam()
  const me = useMe()
  const memberOf = (id: string) => team.find((m) => m.id === id)
  const mine = projects.filter((p) => p.assignee === (me?.id ?? '') && p.status !== 'PUBLISHED' && p.status !== 'CLOSED')

  return (
    <div className="space-y-8">
      <PageHeader
        title="My work"
        subtitle={`Projects assigned to you - ${mine.length} active`}
        actions={<Link to="/projects" className="btn-secondary">All projects</Link>}
      />

      {GROUPS.map((g) => {
        const list = mine.filter((p) => g.statuses.includes(p.status))
        if (!list.length) return null
        return (
          <section key={g.key}>
            <div className="mb-3 flex items-baseline gap-2.5">
              <h2 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">{g.label}</h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{g.hint}</span>
              <span className="ml-auto rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[10px] text-umber">{list.length}</span>
            </div>
            <div className="stagger space-y-3">
              {list.map((p) => (
                <div key={p.id} className="card card-hover group flex flex-wrap items-center gap-4 p-5">
                  <Avatar initials={memberOf(p.assignee)?.initials ?? '?'} size="md" tone="tint" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/projects/${p.id}`}
                      className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink transition-colors group-hover:text-teal-press"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-umber">{p.type} · {p.updated}</p>
                  </div>
                  <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} dot />
                  {['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED'].includes(p.status) && (
                    <Link
                      to={`/projects/${p.id}/review`}
                      className="btn-secondary btn-sm group/btn"
                    >
                      Open review
                      <ArrowRight size={14} strokeWidth={1.75} className="transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {!mine.length && (
        <div className="card flex flex-col items-center p-14 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-tint text-teal">
            <FolderKanban size={22} strokeWidth={1.75} />
          </span>
          <p className="font-headline text-base font-semibold text-ink">Nothing assigned to you yet</p>
          <p className="mt-1 max-w-sm text-sm text-umber">When a project is assigned to you, it will show up here.</p>
        </div>
      )}
    </div>
  )
}
