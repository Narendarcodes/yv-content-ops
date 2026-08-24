import { useState } from 'react'
import { Search, UserPlus, Users } from 'lucide-react'
import Avatar from '../components/ui'
import Chip, { Modal } from '../components/primitives'
import { useMembers } from '../lib/data'
import { useToast } from '../components/toast'

const roleTone: Record<string, 'teal' | 'neutral' | 'warning' | 'success'> = {
  Admin: 'teal',
  Editor: 'warning',
  Reviewer: 'success',
  Designer: 'neutral',
  Publisher: 'neutral',
}

const ROLE_OPTIONS = ['Editor', 'Reviewer', 'Designer', 'Publisher', 'Member']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function MembersPage() {
  const toast = useToast()
  const { members, org } = useMembers()
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Editor')
  const [inviteError, setInviteError] = useState(false)
  const filtered = members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))

  const sendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(inviteEmail.trim())) {
      setInviteError(true)
      return
    }
    setInviteError(false)
    setInviteOpen(false)
    setInviteEmail('')
    // Demo: invite is simulated - the backend members API sends the real email later
    toast('success', 'Invitation sent', `${inviteEmail.trim()} was invited as ${inviteRole}.`)
  }

  return (
    <div className="fade-in">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Members</h1>
          <p className="mt-1 text-sm text-umber">{members.length} people in {org?.name ?? 'your workspace'}</p>
        </div>
        <button onClick={() => setInviteOpen(true)} className="btn-primary">
          <UserPlus size={14} strokeWidth={2} />
          Invite member
        </button>
      </header>

      <div className="relative mb-5 w-64">
        <Search size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-umber/60" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members…" className="input !pl-9 !h-9" />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 text-umber">
                <Users size={18} strokeWidth={1.75} />
              </span>
              <p className="text-sm font-medium text-ink">No members yet</p>
              <p className="text-[13px] text-umber">Invite someone to get the team started.</p>
            </div>
          ) : (
            <>
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
              {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 text-umber">
                    <Users size={18} strokeWidth={1.75} />
                  </span>
                  <p className="text-sm font-medium text-ink">No members match “{query}”</p>
                  <p className="text-[13px] text-umber">Try a different name, or clear the search.</p>
                  <button onClick={() => setQuery('')} className="btn-ghost mt-1 text-teal">
                    Clear search
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invite member */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a member">
        <form onSubmit={sendInvite} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="invite-email" className="label">Email address</label>
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value)
                setInviteError(false)
              }}
              placeholder="name@example.com"
              className={`input ${inviteError ? 'input-error' : ''}`}
              autoFocus
            />
            {inviteError && (
              <p className="mt-1.5 text-xs text-danger">Enter a valid email address.</p>
            )}
          </div>
          <div>
            <label htmlFor="invite-role" className="label">Role</label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="input"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setInviteOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Send invite
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
