import { Link } from 'react-router-dom'
import { PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { Skeleton, ErrorBanner, EmptyState } from '../components/states'
import { useBoard, useTeam } from '../lib/data'
import type { BoardTask } from '../lib/data'

const memberOf = (team: { id: string; initials: string }[], id: string) =>
  team.find((m) => m.id === id)

const COLUMNS: { key: BoardTask['status']; column: string; accent: string }[] = [
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

export default function BoardPage() {
  const { tasks, loading, error } = useBoard()
  const { team } = useTeam()

  const grouped = COLUMNS.map((c) => ({
    ...c,
    cards: tasks.filter((t) => t.status === c.key),
  }))

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Board"
        subtitle="Every task across the team’s content pipeline."
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <Skeleton className="h-3 w-20" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorBanner onRetry={() => window.location.reload()} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          hint="Tasks live inside projects. Open a project to add its first task."
        />
      ) : (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {grouped.length === 0 ? (
          <p className="py-10 text-center text-sm text-umber">No tasks yet. Create a project to get started.</p>
        ) : (
          grouped.map((col) => (
            <div key={col.column} className="card flex flex-col p-0">
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className={`flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${accentText[col.accent]}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
                  {col.column}
                </span>
                <span className="font-mono text-[11px] text-umber/60">{col.cards.length}</span>
              </header>
              <div className="flex-1 space-y-2.5 p-3">
                {col.cards.map((card) => (
                  <div key={card.id} className="rounded-[8px] border border-line bg-surface p-3.5 transition-shadow hover:shadow-pop">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-umber/60">{card.projectTitle}</span>
                      <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${priorityTone[card.priority]}`}>{card.priority}</span>
                    </div>
                    <p className="text-sm font-medium leading-snug text-ink">{card.title}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Avatar initials={memberOf(team, card.assignee)?.initials ?? '?'} size="xs" tone="tint" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">
                        {card.due ? `Due ${card.due}` : 'No due date'}
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/projects" className="block rounded-[8px] border border-dashed border-line py-2 text-center text-xs font-medium text-umber hover:border-teal hover:text-teal">
                  Open a project to add tasks
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      )}
    </div>
  )
}
