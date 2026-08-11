import { Link } from 'react-router-dom'
import Chip, { statusTone, StatCard, EmptyState } from '../components/primitives'
import Avatar, { AvatarStack } from '../components/ui'
import { projects, briefs, activity, metrics } from '../lib/mockData'

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const FolderIco = () => (
  <svg {...iconProps}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></svg>
)
const ReviewIco = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
)
const PublishIco = () => (
  <svg {...iconProps}><path d="M4 12h16M4 12l6-6M4 12l6 6" /></svg>
)
const InvoiceIco = () => (
  <svg {...iconProps}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /></svg>
)

export default function DashboardPage() {
  return (
    <div className="fade-in space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Good morning, Ananya</h1>
        <p className="mt-1 text-sm text-umber">Here&apos;s what&apos;s moving across your studio today.</p>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Projects" value={metrics.activeProjects} icon={<FolderIco />} tone="teal" />
        <StatCard label="Pending Reviews" value={metrics.pendingReviews} icon={<ReviewIco />} tone="warning" />
        <StatCard label="Published This Month" value={metrics.publishedThisMonth} icon={<PublishIco />} tone="success" />
        <StatCard label="Open Invoices" value={metrics.openInvoices} icon={<InvoiceIco />} tone="danger" />
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Projects to watch */}
        <div className="card p-0 xl:col-span-2">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Projects to watch</h2>
            <Link to="/projects" className="text-xs font-medium text-teal hover:underline">View all</Link>
          </header>
          <ul className="divide-y divide-line">
            {projects.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link to={`/projects/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas/60">
                  <Avatar initials={p.client.slice(0, 2).toUpperCase()} size="md" tone="tint" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <p className="truncate text-xs text-umber">{p.client}</p>
                  </div>
                  <div className="hidden sm:block">
                    <Chip label={p.status} tone={statusTone(p.status)} dot />
                  </div>
                  <span className="hidden w-16 text-right font-mono text-xs text-umber/70 md:block">{p.deadline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Activity feed */}
        <div className="card p-0">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Recent activity</h2>
            <Link to="/activity" className="text-xs font-medium text-teal hover:underline">View all</Link>
          </header>
          <ul className="divide-y divide-line">
            {activity.slice(0, 5).map((a, i) => (
              <li key={i} className="flex gap-3 px-5 py-3.5">
                <Avatar initials={a.actor} size="sm" tone={i % 2 ? 'tint' : 'teal'} />
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-ink">
                    <span className="font-medium">{a.name}</span> {a.verb}{' '}
                    <span className="font-medium text-teal">{a.target}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-umber/60">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quick briefs strip */}
      <section>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Briefs awaiting action</h2>
          <Link to="/briefs" className="text-xs font-medium text-teal hover:underline">All briefs</Link>
        </header>
        {briefs.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {briefs.slice(0, 3).map((b) => (
              <Link key={b.id} to={`/briefs/${b.id}`} className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-pop">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{b.id}</span>
                  <Chip label={b.status} tone={statusTone(b.status)} />
                </div>
                <h3 className="font-headline text-[15px] font-semibold leading-snug tracking-tight text-ink">{b.title}</h3>
                <p className="mt-1 text-xs text-umber">{b.project}</p>
                <div className="mt-4 flex items-center justify-between">
                  <AvatarStack initials={[b.writer, 'SL']} max={2} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">Due {b.deadline}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={<FolderIco />} title="No briefs yet" description="Create your first brief to get started." />
        )}
      </section>
    </div>
  )
}
