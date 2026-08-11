import { Link } from 'react-router-dom'
import { useState } from 'react'
import Chip, { statusTone, PageHeader, EmptyState } from '../components/primitives'
import { AvatarStack } from '../components/ui'
import { projects } from '../lib/mockData'

const tabs = ['All', 'Active', 'In Review', 'Draft']

export default function ProjectsPage() {
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')

  const filtered = projects.filter((p) => {
    const inTab = tab === 'All' || p.status === tab
    const inQuery = p.name.toLowerCase().includes(query.toLowerCase()) || p.client.toLowerCase().includes(query.toLowerCase())
    return inTab && inQuery
  })

  return (
    <div className="fade-in">
      <PageHeader
        title="Active Projects"
        subtitle="All client work across the studio"
        actions={
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New project
          </button>
        }
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-[8px] border border-line bg-surface p-0.5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-[6px] px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                tab === t ? 'bg-ink text-on-accent' : 'text-umber hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-56">
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
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head">Project</th>
                <th className="table-head">Client</th>
                <th className="table-head">Status</th>
                <th className="table-head">Deadline</th>
                <th className="table-head">Team</th>
                <th className="table-head">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="px-5 py-3.5">
                    <Link to={`/projects/${p.id}`} className="font-medium text-ink hover:text-teal">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-umber">{p.client}</td>
                  <td className="px-5 py-3.5">
                    <Chip label={p.status} tone={statusTone(p.status)} dot />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink/80">{p.deadline}</td>
                  <td className="px-5 py-3.5">
                    <AvatarStack initials={['EK', 'MR', 'SL']} max={3} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-umber/70">{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></svg>}
              title="No projects found"
              description="Try a different filter or search term."
            />
          </div>
        )}
      </div>
    </div>
  )
}
