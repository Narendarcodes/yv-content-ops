/**
 * Global command palette (⌘K / Ctrl+K) - search projects and people,
 * then jump straight to them. Wired to the top-bar search box.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search, User, X } from 'lucide-react'
import { statusLabel } from '../lib/format'
import { useProjects, useTeam } from '../lib/data'
import Chip from './primitives'

interface Result {
  kind: 'project' | 'person'
  id: string
  title: string
  sub: string
  to: string
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { projects } = useProjects()
  const { team } = useTeam()

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      const t = window.setTimeout(() => inputRef.current?.focus(), 10)
      return () => window.clearTimeout(t)
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase()
    const projectHits = projects
      .filter((p) => !query || p.title.toLowerCase().includes(query) || p.type.toLowerCase().includes(query))
      .slice(0, 6)
      .map((p) => ({
        kind: 'project' as const,
        id: p.id,
        title: p.title,
        sub: `${statusLabel(p.status)} · ${p.type}`,
        to: `/projects/${p.id}`,
      }))
    const peopleHits = team
      .filter((m) => !query || m.name.toLowerCase().includes(query) || m.title.toLowerCase().includes(query) || m.role.includes(query))
      .slice(0, 4)
      .map((m) => ({
        kind: 'person' as const,
        id: m.id,
        title: m.name,
        sub: `${m.title} · ${m.role}`,
        to: '/profile',
      }))
    return [...projectHits, ...peopleHits]
  }, [q, projects, team])

  if (!open) return null

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active].to)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        className="modal-in relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} strokeWidth={1.75} className="text-umber/50" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKey}
            placeholder="Search projects, people…"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-umber/50"
          />
          <button onClick={onClose} className="icon-btn icon-btn-sm" aria-label="Close search">
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-umber">No results for “{q}”.</p>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`}>
                  <button
                    onClick={() => go(r.to)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${i === active ? 'bg-tint/60' : ''}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${r.kind === 'project' ? 'bg-ink/5 text-umber' : 'bg-tint text-teal'}`}
                    >
                      {r.kind === 'project' ? <FileText size={14} strokeWidth={1.75} /> : <User size={14} strokeWidth={1.75} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{r.title}</span>
                      <span className="block truncate text-xs text-umber">{r.sub}</span>
                    </span>
                    <Chip label={r.kind === 'project' ? 'Project' : 'Person'} tone="neutral" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-umber/60">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}