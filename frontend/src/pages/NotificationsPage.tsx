import { useState } from 'react'
import { notifications } from '../lib/mockData'

const typeMeta: Record<string, { icon: JSX.Element; tone: string }> = {
  mention: {
    tone: 'bg-tint text-teal',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path d="M2.5 13c.5-3 2.5-4.5 5.5-4.5s5 1.5 5.5 4.5" strokeLinecap="round" />
      </svg>
    ),
  },
  approval: {
    tone: 'bg-success/10 text-success',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="8" cy="8" r="6.5" />
        <path d="m5 8.5 2 2 4-4.5" strokeLinecap="round" />
      </svg>
    ),
  },
  deadline: {
    tone: 'bg-warning/10 text-warning',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  comment: {
    tone: 'bg-ink/5 text-umber',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M1.5 3A1.5 1.5 0 0 1 3 1.5h10A1.5 1.5 0 0 1 14.5 3v6A1.5 1.5 0 0 1 13 10.5H6l-4 3v-9.5Z" strokeLinejoin="round" />
      </svg>
    ),
  },
}

export default function NotificationsPage() {
  const [all, setAll] = useState(notifications)
  const [tab, setTab] = useState<'All' | 'Unread'>('All')
  const visible = tab === 'All' ? all : all.filter((n) => n.unread)

  return (
    <div className="fade-in mx-auto max-w-3xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-umber">Mentions, approvals and deadlines</p>
        </div>
        <button
          onClick={() => setAll(all.map((n) => ({ ...n, unread: false })))}
          className="btn-ghost text-teal"
        >
          Mark all as read
        </button>
      </header>

      <div className="mb-5 flex rounded-[8px] border border-line bg-surface p-0.5 w-fit">
        {(['All', 'Unread'] as const).map((t) => (
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

      <div className="card divide-y divide-line p-0">
        {visible.map((n) => {
          const meta = typeMeta[n.type] ?? typeMeta.comment
          return (
            <button
              key={n.id}
              className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-canvas/60 ${
                n.unread ? 'bg-tint/30' : ''
              }`}
            >
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                {meta.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  {n.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />}
                </div>
                <p className="mt-0.5 truncate text-[13px] text-umber">{n.desc}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-umber/50">{n.time}</p>
              </div>
            </button>
          )
        })}
        {visible.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-umber">You&apos;re all caught up.</p>
        )}
      </div>
    </div>
  )
}
