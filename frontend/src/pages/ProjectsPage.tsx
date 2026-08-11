import { Link } from 'react-router-dom'
import { useState } from 'react'
import Chip, { statusTone, PageHeader, Tabs } from '../components/primitives'
import Avatar from '../components/ui'
import { projects, team, type Project } from '../lib/mockData'
import { statusLabel } from '../lib/format'

const memberOf = (id: string) => team.find((m) => m.id === id)

const PHASES: { id: string; label: string; match: (p: Project) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'active', label: 'In production', match: (p) => ['ASSIGNED', 'WAITING_FOR_INPUTS', 'INPUTS_READY', 'IN_PROGRESS'].includes(p.status) },
  { id: 'review', label: 'In review', match: (p) => ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'REVISION_IN_PROGRESS', 'REVISION_SUBMITTED'].includes(p.status) },
  { id: 'approved', label: 'Approved', match: (p) => ['APPROVED', 'SCHEDULED'].includes(p.status) },
  { id: 'published', label: 'Published', match: (p) => ['PUBLISHED', 'CLOSED'].includes(p.status) },
]

export default function ProjectsPage() {
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const phase = PHASES.find((x) => x.id === tab)!

  const filtered = projects.filter((p) => {
    const inTab = phase.match(p)
    const q = query.trim().toLowerCase()
    const inQuery = !q || p.title.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || (memberOf(p.assignee)?.name.toLowerCase().includes(q) ?? false)
    return inTab && inQuery
  })

  const counts = (id: string) => projects.filter((p) => PHASES.find((x) => x.id === id)!.match(p)).length

  return (
    <div className="fade-in">
      <PageHeader
        title="Projects"
        subtitle="Every content project across its lifecycle — from production to published."
        actions={
          <Link to="/concepts" className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Start from a concept
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <Tabs
            tabs={PHASES.map((x) => ({ id: x.id, label: x.label, count: counts(x.id) }))}
            active={tab}
            onChange={setTab}
          />
        </div>
        <div className="relative w-56">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-umber/60">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter projects…"
            className="input !pl-9 !h-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head">Project</th>
                <th className="table-head">Type</th>
                <th className="table-head">Status</th>
                <th className="table-head">Assignee</th>
                <th className="table-head">Platform</th>
                <th className="table-head">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="px-5 py-3.5">
                    <Link to={`/projects/${p.id}`} className="font-medium text-ink hover:text-teal">
                      {p.title}
                    </Link>
                    {p.status === 'PUBLISHED' && p.postUrl && (
                      <a href={p.postUrl} target="_blank" rel="noreferrer" className="mt-0.5 block text-xs text-teal hover:underline">
                        View live post
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-umber">{p.type}</td>
                  <td className="px-5 py-3.5">
                    <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} dot />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <Avatar initials={memberOf(p.assignee)?.initials ?? '?'} size="xs" tone="tint" />
                      <span className="text-sm text-ink/80">{memberOf(p.assignee)?.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-umber">{p.platform ?? '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-umber/70">{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-umber">No projects match this view. Try another phase or search term.</p>
          </div>
        )}
      </div>
    </div>
  )
}
