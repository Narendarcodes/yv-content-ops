import { Link } from 'react-router-dom'
import { useState } from 'react'
import Chip, { statusTone, PageHeader, EmptyState } from '../components/primitives'
import Avatar from '../components/ui'
import { briefs } from '../lib/mockData'

const tabs = ['All', 'Draft', 'In Review', 'Approved']

export default function BriefsPage() {
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')

  const filtered = briefs.filter((b) => {
    const inTab = tab === 'All' || b.status === tab
    const inQuery = b.title.toLowerCase().includes(query.toLowerCase())
    return inTab && inQuery
  })

  return (
    <div className="fade-in">
      <PageHeader
        title="Briefs"
        subtitle="Creative direction and requirements for every piece"
        actions={
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New brief
          </button>
        }
      />

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
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter briefs…" className="input !pl-9 !h-9" />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head">Brief</th>
                <th className="table-head">Project</th>
                <th className="table-head">Writer</th>
                <th className="table-head">Words</th>
                <th className="table-head">Status</th>
                <th className="table-head">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="table-row">
                  <td className="px-5 py-3.5">
                    <Link to={`/briefs/${b.id}`} className="font-medium text-ink hover:text-teal">{b.title}</Link>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-umber/70">{b.id}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-umber">{b.project}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar initials={b.writer} size="xs" tone="tint" />
                      <span className="text-sm text-ink/80">{b.writer}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink/80">{b.words}</td>
                  <td className="px-5 py-3.5">
                    <Chip label={b.status} tone={statusTone(b.status)} dot />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink/80">{b.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                </svg>
              }
              title="No briefs found"
              description="Try a different filter or search term."
            />
          </div>
        )}
      </div>
    </div>
  )
}
