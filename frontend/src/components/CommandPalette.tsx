/**
 * Global command palette (⌘K / Ctrl+K) — clean editorial search for projects.
 * Projects-only by default (people search was routing everyone to /profile).
 * Re-enable the People section by uncommenting the block below if you add a per-person view.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { FileText, Search, X } from 'lucide-react'
import { statusLabel } from '../lib/format'
import { useProjects } from '../lib/data'

interface Result {
  kind: 'project'
  id: string
  title: string
  sub: string
  to: string
}

export default function CommandPalette({ open, initialQuery = '', onClose }: { open: boolean; initialQuery?: string; onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState(initialQuery)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { projects } = useProjects()

  useEffect(() => {
    if (open) {
      setQ(initialQuery)
      setActive(0)
      const t = window.setTimeout(() => inputRef.current?.focus(), 10)
      return () => window.clearTimeout(t)
    }
  }, [open, initialQuery])

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  const results = useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase()
    return projects
      .filter((p) => !query || p.title.toLowerCase().includes(query) || p.type.toLowerCase().includes(query) || p.status.toLowerCase().includes(query))
      .slice(0, 8)
      .map((p) => ({
        kind: 'project' as const,
        id: p.id,
        title: p.title,
        sub: `${statusLabel(p.status)} · ${p.type}`,
        to: `/projects/${p.id}`,
      }))
  }, [q, projects])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      go(results[active].to)
    }
  }

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(results.length - 1, 0)))
  }, [results.length])

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[14vh]">
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <div
        className="modal-in relative w-full max-w-[560px] overflow-hidden rounded-[20px] border border-line bg-surface shadow-[0_16px_40px_rgba(28,25,23,0.16),0_4px_12px_rgba(28,25,23,0.08)]"
        role="dialog"
        aria-modal="true"
        aria-label="Search projects"
      >
        {/* Input — single focus ring, no double border */}
        <div className="group flex items-center gap-3 border-b border-line bg-canvas/40 px-4 py-3.5 transition-colors focus-within:border-teal/30 focus-within:bg-surface">
          <Search size={18} strokeWidth={1.75} className="shrink-0 text-umber/40 transition-colors group-focus-within:text-teal/70" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKey}
            placeholder="Search projects…"
            className="h-7 flex-1 bg-transparent text-[15px] leading-none text-ink outline-none placeholder:text-umber/40"
            aria-label="Search projects"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/5 text-umber/60 transition-colors hover:bg-ink/10 hover:text-ink"
              aria-label="Clear search"
            >
              <X size={13} strokeWidth={2} />
            </button>
          )}
          <button onClick={onClose} className="ml-1 hidden items-center justify-center rounded-full p-1.5 text-umber/40 hover:bg-ink/5 hover:text-ink md:flex" aria-label="Close search">
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[52vh] overflow-y-auto overscroll-contain p-2.5 [scrollbar-width:thin] [scrollbar-color:rgba(28,25,23,0.12)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ink/10">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-headline text-sm font-medium text-ink">No projects found</p>
              <p className="mt-1 text-xs text-umber">Try a different title, type, or status.</p>
              {q && <p className="mt-2 font-mono text-xs text-umber/50">“{q}”</p>}
            </div>
          ) : (
            <div>
              <p className="px-3 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-wider text-umber/50">
                Projects · {results.length}
              </p>
              <ul className="space-y-1">
                {results.map((r, i) => (
                  <li key={r.id}>
                    <button
                      onClick={() => go(r.to)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                        i === active
                          ? 'border-line bg-canvas shadow-sm ring-1 ring-ink/[0.04]'
                          : 'border-transparent hover:border-line/60 hover:bg-canvas/60'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-umber transition-colors ${
                          i === active ? 'border-line bg-surface text-teal shadow-sm' : 'border-line/50 bg-canvas'
                        }`}
                      >
                        <FileText size={15} strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-headline text-[14px] font-medium leading-tight tracking-[-0.01em] text-ink">{r.title}</span>
                        <span className="mt-0.5 block truncate font-mono text-[11px] leading-none tracking-wide text-umber/70">{r.sub}</span>
                      </span>
                      <span className="hidden shrink-0 rounded-full border border-line bg-ink/[0.04] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-umber/60 md:inline-flex">
                        Project
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-canvas/30 px-4 py-2.5">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-umber/50">
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] shadow-sm">↑</kbd>
              <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] shadow-sm">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] shadow-sm">↵</kbd>
              <span>Open</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] shadow-sm">ESC</kbd>
              <span>Close</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-umber/40">{results.length} results</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
