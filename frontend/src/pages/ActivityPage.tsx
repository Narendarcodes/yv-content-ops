import Avatar from '../components/ui'
import { activity } from '../lib/mockData'

export default function ActivityPage() {
  return (
    <div className="fade-in mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Activity log</h1>
        <p className="mt-1 text-sm text-umber">The complete audit trail across your workspace</p>
      </header>

      <div className="space-y-1">
        {activity.map((a, i) => (
          <div key={i} className="card p-4 transition-colors hover:border-ink/15">
            <div className="flex items-start gap-4">
              <Avatar initials={a.actor} size="md" tone={i % 2 ? 'tint' : 'teal'} />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-ink">
                  <span className="font-medium">{a.name}</span> {a.verb}{' '}
                  <span className="font-medium text-teal">{a.target}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-umber/70">
                    {a.project}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-umber/70">{a.time}</span>
                </div>
              </div>
              <button className="btn-ghost !h-8 !px-2.5 text-umber" aria-label="More">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="2.5" cy="7" r="1" fill="currentColor" />
                  <circle cx="7" cy="7" r="1" fill="currentColor" />
                  <circle cx="11.5" cy="7" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
