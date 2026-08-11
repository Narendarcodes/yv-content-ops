import { useState } from 'react'
import Avatar from '../components/ui'
import Chip from '../components/primitives'
import { members } from '../lib/mockData'

const roleTone: Record<string, 'teal' | 'neutral' | 'warning' | 'success'> = {
  Admin: 'teal',
  Editor: 'warning',
  Reviewer: 'success',
  Writer: 'neutral',
  Publisher: 'neutral',
}

export default function MembersPage() {
  const [query, setQuery] = useState('')
  const filtered = members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="fade-in">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Members</h1>
          <p className="mt-1 text-sm text-umber">{members.length} people in Northern Lights Studio</p>
        </div>
        <button className="btn-primary">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Invite member
        </button>
      </header>

      <div className="relative mb-5 w-64">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-umber/60">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members…" className="input !pl-9 !h-9" />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head">Member</th>
                <th className="table-head">Email</th>
                <th className="table-head">Role</th>
                <th className="table-head">Last active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar initials={m.initials} size="md" tone={m.role === 'Admin' ? 'ink' : 'tint'} />
                      <span className="font-medium text-ink">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-umber">{m.email}</td>
                  <td className="px-5 py-3.5">
                    <Chip label={m.role} tone={roleTone[m.role] ?? 'neutral'} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-umber/70">{m.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
