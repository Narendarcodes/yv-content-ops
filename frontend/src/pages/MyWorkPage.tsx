import { Link } from 'react-router-dom'
import Chip, { statusTone, PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { projects, team } from '../lib/mockData'
import { statusLabel } from '../lib/format'
import { useViewer } from '../lib/viewer'

const memberOf = (id: string) => team.find((m) => m.id === id)

const GROUPS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'active', label: 'In production', statuses: ['ASSIGNED', 'WAITING_FOR_INPUTS', 'INPUTS_READY', 'IN_PROGRESS'] },
  { key: 'review', label: 'In review', statuses: ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'REVISION_IN_PROGRESS', 'REVISION_SUBMITTED'] },
  { key: 'approved', label: 'Approved', statuses: ['APPROVED', 'SCHEDULED'] },
]

export default function MyWorkPage() {
  const viewer = useViewer()
  const mine = projects.filter((p) => p.assignee === viewer.id && p.status !== 'PUBLISHED' && p.status !== 'CLOSED')

  return (
    <div className="fade-in space-y-8">
      <PageHeader
        title="My work"
        subtitle={`Projects assigned to you — ${mine.length} active`}
        actions={<Link to="/projects" className="btn-secondary">All projects</Link>}
      />

      {GROUPS.map((g) => {
        const list = mine.filter((p) => g.statuses.includes(p.status))
        if (!list.length) return null
        return (
          <section key={g.key}>
            <h2 className="mb-3 font-headline text-base font-semibold tracking-tight text-ink">{g.label}</h2>
            <div className="space-y-3">
              {list.map((p) => (
                <div key={p.id} className="card flex flex-wrap items-center gap-4 p-5">
                  <Avatar initials={memberOf(p.assignee)?.initials ?? '?'} size="md" tone="tint" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/projects/${p.id}`} className="font-headline text-[15px] font-semibold tracking-tight text-ink hover:text-teal">
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-umber">{p.type} · {p.updated}</p>
                  </div>
                  <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} dot />
                  {['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED'].includes(p.status) && (
                    <Link to={`/projects/${p.id}/review`} className="btn-secondary !h-9">Open review</Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {!mine.length && (
        <div className="card p-12 text-center">
          <p className="text-sm text-umber">Nothing assigned to you yet.</p>
        </div>
      )}
    </div>
  )
}
