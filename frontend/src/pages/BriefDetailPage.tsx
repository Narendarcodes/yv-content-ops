import { Link, useParams } from 'react-router-dom'
import Chip, { statusTone } from '../components/primitives'
import { AvatarStack } from '../components/ui'
import { briefs } from '../lib/mockData'

export default function BriefDetailPage() {
  const { id } = useParams()
  const brief = briefs.find((b) => b.id === id) ?? briefs[0]

  return (
    <div className="fade-in space-y-6">
      <nav className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-umber/60">
        <Link to="/briefs" className="hover:text-teal">Briefs</Link>
        <span>/</span>
        <span className="text-ink">{brief.id}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">{brief.title}</h1>
            <Chip label={brief.status} tone={statusTone(brief.status)} dot />
          </div>
          <p className="mt-1 text-sm text-umber">
            {brief.project} · Writer <span className="font-medium text-ink">{brief.writer}</span> · Due {brief.deadline}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">Request revision</button>
          <button className="btn-primary">Approve brief</button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-3 font-headline text-base font-semibold tracking-tight text-ink">Objective</h2>
          <p className="text-sm leading-relaxed text-ink/80">
            Produce a compelling narrative that frames the brand&apos;s seasonal story, grounding it in the
            sustainability commitments outlined by the client. The piece should read as editorial, not
            promotional, while still driving clear conversion intent.
          </p>

          <h2 className="mb-3 mt-7 font-headline text-base font-semibold tracking-tight text-ink">Key requirements</h2>
          <ul className="space-y-2.5">
            {[
              'Lead with the hero narrative and seasonal angle',
              'Include at least two verified market data points',
              'Maintain warm, editorial tone throughout',
              'Close with a single clear call-to-action',
            ].map((req, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink/80">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-tint text-teal">
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-4 font-headline text-base font-semibold tracking-tight text-ink">Details</h2>
            <dl className="space-y-3">
              {[
                { k: 'Brief ID', v: brief.id },
                { k: 'Format', v: 'Editorial article' },
                { k: 'Word count', v: brief.words },
                { k: 'Deadline', v: brief.deadline },
                { k: 'Status', v: brief.status },
              ].map((d) => (
                <div key={d.k} className="flex items-center justify-between">
                  <dt className="text-[10px] font-mono uppercase tracking-wider text-umber/60">{d.k}</dt>
                  <dd className="text-sm font-medium text-ink">{d.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-headline text-base font-semibold tracking-tight text-ink">Assignees</h2>
            <div className="flex items-center justify-between">
              <AvatarStack initials={[brief.writer, 'SL', 'MK']} max={3} />
              <button className="btn-ghost text-teal">Manage</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
