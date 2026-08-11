import { Link } from 'react-router-dom'
import { PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { kanban, team } from '../lib/mockData'

const memberOf = (id: string) => team.find((m) => m.id === id)

const accentText: Record<string, string> = {
  neutral: 'bg-ink/5 text-umber',
  teal: 'bg-tint text-teal',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
}

const priorityTone: Record<string, string> = {
  High: 'bg-danger/10 text-danger',
  Medium: 'bg-warning/10 text-warning',
  Low: 'bg-ink/5 text-umber',
}

export default function BoardPage() {
  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Board"
        subtitle="Every task across the team’s content pipeline — from backlog to done."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kanban.map((col) => (
          <div key={col.column} className="card flex flex-col p-0">
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className={`flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${accentText[col.accent]}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
                {col.column}
              </span>
              <span className="font-mono text-[11px] text-umber/60">{col.count}</span>
            </header>
            <div className="flex-1 space-y-2.5 p-3">
              {col.cards.map((card) => (
                <div key={card.id} className="rounded-[8px] border border-line bg-surface p-3.5 transition-shadow hover:shadow-pop">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-umber/60">{card.project}</span>
                    <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${priorityTone[card.priority]}`}>{card.priority}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug text-ink">{card.title}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Avatar initials={memberOf(card.assignee)?.initials ?? '?'} size="xs" tone="tint" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">Due {card.due}</span>
                  </div>
                </div>
              ))}
              <Link to="/projects" className="block rounded-[8px] border border-dashed border-line py-2 text-center text-xs font-medium text-umber hover:border-teal hover:text-teal">
                Open a project to add tasks
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
