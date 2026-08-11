import { Link, useParams } from 'react-router-dom'
import Chip, { statusTone } from '../components/primitives'
import Avatar, { AvatarStack } from '../components/ui'
import { projects, versions } from '../lib/mockData'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const project = projects.find((p) => p.id === id) ?? projects[0]

  return (
    <div className="fade-in space-y-6">
      {/* Breadcrumb + header */}
      <nav className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-umber/60">
        <Link to="/projects" className="hover:text-teal">Projects</Link>
        <span>/</span>
        <span className="text-ink">{project.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">{project.name}</h1>
            <Chip label={project.status} tone={statusTone(project.status)} dot />
          </div>
          <p className="mt-1 text-sm text-umber">
            Client: <span className="font-medium text-ink">{project.client}</span> · Deadline {project.deadline}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 8a5.5 5.5 0 0 1 12 0M3.5 5.5 1 8l2.5 2.5M13 8l-2.5 2.5M8 8V3M8 3l1.8 1.8M8 3 6.2 4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Version history
          </button>
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h2l1 1.5h5a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 11 11.5H3A1.5 1.5 0 0 1 1.5 10v-6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M7 5.5v4M5 7.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            New version
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Current version', value: 'v1.2', sub: 'Elena K. · Oct 24' },
          { label: 'Words delivered', value: '2,480 / 2,500', sub: '99% complete' },
          { label: 'Team', value: '', sub: '', team: true },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-umber/70">{s.label}</p>
            {s.team ? (
              <div className="mt-3">
                <AvatarStack initials={['EK', 'MR', 'SL', 'DP']} max={4} />
              </div>
            ) : (
              <>
                <p className="mt-2 font-mono text-xl font-medium text-ink">{s.value}</p>
                <p className="mt-0.5 text-xs text-umber">{s.sub}</p>
              </>
            )}
          </div>
        ))}
      </section>

      {/* Main split: brief summary + versions */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Brief summary</h2>
            <Link to={`/briefs/BRF-2041`} className="text-xs font-medium text-teal hover:underline">Open brief</Link>
          </header>
          <p className="text-sm leading-relaxed text-ink/80">
            Deliver an editorial lookbook story that pairs winter campaign imagery with concise narrative copy.
            The piece should lead with the hero product narrative, include a sustainability angle, and close with a
            clear call-to-action for the seasonal collection.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: 'Format', v: 'Lookbook' },
              { k: 'Words', v: '2,500' },
              { k: 'Tone', v: 'Warm, editorial' },
              { k: 'Reviewers', v: '2' },
            ].map((f) => (
              <div key={f.k} className="rounded-[8px] border border-line bg-canvas/50 px-3 py-2.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-umber/60">{f.k}</p>
                <p className="mt-1 text-[13px] font-medium text-ink">{f.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Versions timeline */}
        <div className="card p-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Versions</h2>
            <Link to="/versions" className="text-xs font-medium text-teal hover:underline">View all</Link>
          </header>
          <ol className="relative space-y-5 border-l border-line pl-5">
            {versions.map((v) => (
              <li key={v.id} className="relative">
                <span className={`absolute -left-[25.5px] top-1 h-3 w-3 rounded-full border-2 border-surface ${v.status === 'Current' ? 'bg-teal' : 'bg-ink/20'}`} aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-medium text-teal">{v.tag}</span>
                  <Chip label={v.status} tone={statusTone(v.status)} />
                </div>
                <p className="mt-1 text-sm leading-snug text-ink/80">{v.summary}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Avatar initials={v.initials} size="xs" tone="tint" />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{v.date}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
