import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutList, Columns3, Plus, Search } from 'lucide-react'
import Chip, { statusTone, PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { ListSkeleton, ErrorBanner, EmptyState } from '../components/states'
import { type Project } from '../lib/types'
import { statusLabel } from '../lib/format'
import { useTeam, useProjects, useBoard, type BoardTask } from '../lib/data'
import { setTaskStatus } from '../services/api'
import { useToast } from '../components/toast'

let teamRef: ReturnType<typeof useTeam>['team'] = []
export function setTeamRef(t: typeof teamRef) {
  teamRef = t
}
const memberOf = (id: string) => teamRef.find((m) => m.id === id)

const PHASES: { id: string; label: string; match: (p: Project) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'active', label: 'In production', match: (p) => ['ASSIGNED', 'WAITING_FOR_INPUTS', 'INPUTS_READY', 'IN_PROGRESS'].includes(p.status) },
  { id: 'review', label: 'In review', match: (p) => ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'REVISION_IN_PROGRESS', 'REVISION_SUBMITTED'].includes(p.status) },
  { id: 'approved', label: 'Approved', match: (p) => ['APPROVED', 'SCHEDULED'].includes(p.status) },
  { id: 'published', label: 'Published', match: (p) => ['PUBLISHED', 'CLOSED'].includes(p.status) },
]

type View = 'list' | 'board'
const VIEW_KEY = 'yv.projects.view'

export default function ProjectsPage() {
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>(() => {
    try { return (localStorage.getItem(VIEW_KEY) as View) || 'list' } catch { return 'list' }
  })
  const phase = PHASES.find((x) => x.id === tab)!
  const toast = useToast()

  const { projects, loading, error } = useProjects()
  const { team } = useTeam()
  setTeamRef(team)

  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, view) } catch { /* ignore */ }
  }, [view])

  const filtered = useMemo(() => projects.filter((p) => {
    const inTab = phase.match(p)
    const q = query.trim().toLowerCase()
    const inQuery = !q || p.title.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || (memberOf(p.assignee)?.name.toLowerCase().includes(q) ?? false)
    return inTab && inQuery
  }), [projects, phase, query])

  const counts = (id: string) => projects.filter((p) => PHASES.find((x) => x.id === id)!.match(p)).length

  return (
    <div className="fade-in">
      <PageHeader
        title="Projects"
        subtitle="Every content project, from production through published."
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle — the Asana pattern: same data, two lenses */}
            <div className="flex rounded-[8px] border border-line bg-surface p-0.5" role="tablist" aria-label="View">
              <button
                role="tab"
                aria-selected={view === 'list'}
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors ${view === 'list' ? 'bg-ink text-on-accent' : 'text-umber hover:text-ink'}`}
                title="List view — dense, sortable scan"
              >
                <LayoutList size={14} strokeWidth={1.75} aria-hidden="true" />
                List
              </button>
              <button
                role="tab"
                aria-selected={view === 'board'}
                onClick={() => setView('board')}
                className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors ${view === 'board' ? 'bg-ink text-on-accent' : 'text-umber hover:text-ink'}`}
                title="Board view — drag tasks across stages"
              >
                <Columns3 size={14} strokeWidth={1.75} aria-hidden="true" />
                Board
              </button>
            </div>
            <Link to="/concepts" className="btn-primary">
              <Plus strokeWidth={2} size={14} aria-hidden="true" />
              Start from a concept
            </Link>
          </div>
        }
      />

      {/* Toolbar: phase tabs + search — shared by both views */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto border-b border-line" role="tablist">
          {PHASES.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => setTab(x.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === x.id ? 'border-teal text-ink' : 'border-transparent text-umber hover:text-ink'
              }`}
            >
              {x.label}
              <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] ${tab === x.id ? 'bg-tint text-teal' : 'bg-ink/5 text-umber'}`}>
                {counts(x.id)}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-56">
          <Search size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-umber/60" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter projects…"
            name="filter"
            type="search"
            autoComplete="off"
            aria-label="Filter projects"
            className="input !pl-9 !h-9"
          />
        </div>
      </div>

      {view === 'list' ? (
        <ProjectListView projects={filtered} allProjects={projects} loading={loading} error={error} query={query} />
      ) : (
        <BoardView phase={phase} query={query} toast={toast} />
      )}
    </div>
  )
}

/* ------------------------------ LIST VIEW ------------------------------ */

function ProjectListView({
  projects,
  allProjects,
  loading,
  error,
  query,
}: {
  projects: Project[]
  allProjects: Project[]
  loading: boolean
  error: boolean
  query: string
}) {
  return (
    <div className="card overflow-hidden p-0">
      {loading ? (
        <div className="p-5">
          <ListSkeleton rows={5} height="h-12" />
        </div>
      ) : error ? (
        <div className="p-6">
          <ErrorBanner onRetry={() => window.location.reload()} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head">Project</th>
                <th className="table-head">Status</th>
                <th className="table-head">Assignee</th>
                <th className="table-head">Updated</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="px-5 py-3.5">
                    <Link to={`/projects/${p.id}`} className="font-medium text-ink hover:text-teal">
                      {p.title}
                    </Link>
                    <span className="ml-2 text-xs text-umber/70">{p.type}</span>
                    {p.status === 'PUBLISHED' && p.postUrl && (
                      <a href={p.postUrl} target="_blank" rel="noreferrer" className="mt-0.5 block text-xs text-teal hover:underline">
                        View live post
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Chip label={statusLabel(p.status)} tone={statusTone(p.status)} dot />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <Avatar initials={memberOf(p.assignee)?.initials ?? '?'} size="xs" tone="tint" />
                      <span className="text-sm text-ink/80">{memberOf(p.assignee)?.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-umber/70">{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {projects.length === 0 && !loading && !error && (
        <div className="px-5 py-12 text-center">
          {allProjects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              hint="Start from a concept to create your first project."
              action={
                <Link to="/concepts" className="btn-primary !h-9 text-[13px]">
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  Start from a concept
                </Link>
              }
            />
          ) : (
            <p className="text-sm text-umber">No projects match this view{query ? ` or “${query}”` : ''}. Try another phase or search term.</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------ BOARD VIEW ------------------------------ */

const BOARD_COLUMNS: { key: BoardTask['status']; column: string; accent: string }[] = [
  { key: 'todo', column: 'Backlog', accent: 'neutral' },
  { key: 'in_progress', column: 'In Progress', accent: 'teal' },
  { key: 'in_review', column: 'In Review', accent: 'warning' },
  { key: 'done', column: 'Done', accent: 'success' },
]

const accentText: Record<string, string> = {
  neutral: 'bg-ink/5 text-umber',
  teal: 'bg-tint text-teal',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
}

const priorityTone: Record<string, string> = {
  high: 'bg-danger/10 text-danger',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-ink/5 text-umber',
}

function BoardView({ phase, query, toast }: { phase: { match: (p: Project) => boolean }; query: string; toast: ReturnType<typeof useToast> }) {
  const { tasks, loading, error } = useBoard()
  const { projects } = useProjects()
  const [localTasks, setLocalTasks] = useState<BoardTask[] | null>(null)
  const dragTask = useRef<BoardTask | null>(null)

  // Board respects the same project filters as the list
  const visibleProjectIds = new Set(
    projects
      .filter((p) => {
        const q = query.trim().toLowerCase()
        const inQuery = !q || p.title.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
        return phase.match(p) && inQuery
      })
      .map((p) => p.id),
  )

  const tasks2 = localTasks ?? tasks
  const visible = tasks2.filter((t) => visibleProjectIds.has(t.projectId))

  // Drop local optimistic copy once the server round-trips fresh data
  useEffect(() => { setLocalTasks(null) }, [tasks])

  const onDrop = async (status: BoardTask['status']) => {
    const task = dragTask.current
    dragTask.current = null
    if (!task || task.status === status) return
    const prev = tasks2
    // Optimistic move
    setLocalTasks(prev.map((t) => (t.id === task.id ? { ...t, status } : t)))
    try {
      await setTaskStatus(task.projectId, task.id, status)
      toast('success', 'Task moved', `“${task.title}” → ${BOARD_COLUMNS.find((c) => c.key === status)?.column}`)
    } catch (err: any) {
      setLocalTasks(prev) // revert — no inconsistency between UI and DB
      toast('danger', 'Move failed', err?.message || 'The task is back where it was.')
    }
  }

  const grouped = BOARD_COLUMNS.map((c) => ({ ...c, cards: visible.filter((t) => t.status === c.key) }))

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <ListSkeleton rows={2} height="h-14" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorBanner onRetry={() => window.location.reload()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {grouped.map((col) => (
            <div
              key={col.column}
              className="card flex flex-col p-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => void onDrop(col.key)}
            >
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className={`flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${accentText[col.accent]}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
                  {col.column}
                </span>
                <span className="font-mono text-[11px] text-umber/60" aria-label={`${col.cards.length} tasks`}>{col.cards.length}</span>
              </header>
              <div className="flex-1 space-y-2.5 p-3">
                {col.cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => { dragTask.current = card }}
                    className={`cursor-grab rounded-[8px] border border-line bg-surface p-3.5 transition-shadow hover:shadow-pop active:cursor-grabbing ${card.status === col.key ? '' : 'opacity-60'}`}
                    aria-label={`${card.title} — drag to move`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Link to={`/projects/${card.projectId}`} className="font-mono text-[9px] uppercase tracking-wider text-umber/60 hover:text-teal">
                        {card.projectTitle}
                      </Link>
                      <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${priorityTone[card.priority]}`}>{card.priority}</span>
                    </div>
                    <p className="text-sm font-medium leading-snug text-ink">{card.title}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Avatar initials={memberOf(card.assignee)?.initials ?? '?'} size="xs" tone="tint" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">
                        {card.due ? `Due ${card.due}` : 'No due date'}
                      </span>
                    </div>
                  </div>
                ))}
                {col.cards.length === 0 && (
                  <p className="rounded-[8px] border border-dashed border-line py-3 text-center text-xs text-umber/50">
                    Drop tasks here
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {visible.length === 0 && !loading && (
        <div className="card px-5 py-12 text-center">
          <p className="text-sm text-umber">No tasks in this phase yet. Tasks live inside projects — create one from a concept.</p>
          <Link to="/concepts" className="btn-secondary mt-4">Start from a concept</Link>
        </div>
      )}
    </div>
  )
}
