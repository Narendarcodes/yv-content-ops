import { Link } from 'react-router-dom'
import Avatar from '../components/ui'
import { kanban } from '../lib/mockData'

const accentMap = {
  neutral: 'bg-umber/10 text-umber',
  teal: 'bg-tint text-teal',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
} as const

const priorityDot: Record<string, string> = {
  High: 'bg-danger',
  Medium: 'bg-warning',
  Low: 'bg-umber/40',
}

export default function KanbanPage() {
  return (
    <div className="fade-in">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-umber/60">
            <Link to="/projects" className="hover:text-teal">Projects</Link>
            <span>/</span>
            <span>Kanban</span>
          </nav>
          <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Kanban Board</h1>
          <p className="mt-1 text-sm text-umber">Winter Lookbook Editorial · all tasks</p>
        </div>
        <button className="btn-primary">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Add task
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kanban.map((col) => (
          <div key={col.column} className="flex flex-col rounded-[8px] border border-line bg-canvas/60">
            {/* Column header */}
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${accentMap[col.accent as keyof typeof accentMap].split(' ')[0]}`} aria-hidden="true" />
                <h2 className="text-[13px] font-medium text-ink">{col.column}</h2>
                <span className="rounded-full bg-ink/5 px-1.5 font-mono text-[10px] text-umber">{col.count}</span>
              </div>
              <button className="text-umber/50 transition-colors hover:text-ink" aria-label={`Add to ${col.column}`}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            {/* Cards */}
            <div className="flex-1 space-y-2.5 p-3">
              {col.cards.map((card) => (
                <article
                  key={card.id}
                  className="rise-in cursor-grab rounded-[8px] border border-line bg-surface p-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all hover:border-ink/15 hover:shadow-pop active:cursor-grabbing"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-umber/60">{card.tag}</span>
                    <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-umber)' }} aria-hidden="true" />
                  </div>
                  <h3 className="text-[13px] font-medium leading-snug text-ink">{card.title}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar initials={card.assignee} size="xs" tone={card.priority === 'High' ? 'ink' : 'tint'} />
                      <span className="flex items-center gap-1.5 font-mono text-[10px] text-umber/70">
                        <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[card.priority]}`} aria-hidden="true" />
                        {card.priority}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-umber/70">{card.due}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
