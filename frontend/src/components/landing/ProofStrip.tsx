import Reveal, { CountUp } from './Reveal'

const STATS = [
  { value: 12000, suffix: '+', label: 'assets shipped' },
  { value: 3400, suffix: '', label: 'reviews locked' },
  { value: 98, suffix: '%', label: 'briefs on record' },
]

const TEAMS = ['Northwind Studio', 'Halcyon Media', 'Paper & Pixel', 'Fieldnote Agency', 'Bright Copy Co.', 'Meridian Films']

export default function ProofStrip() {
  return (
    <section className="relative border-y border-line bg-cream/60 py-10">
      <div className="grain absolute inset-0" aria-hidden="true" />
      <Reveal className="mx-auto max-w-6xl px-6">
        <div data-reveal className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl text-ink">
                <CountUp to={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-umber">{s.label}</p>
            </div>
          ))}
        </div>

        {/* quiet team marquee */}
        <div data-reveal className="marquee mt-9 overflow-hidden" aria-hidden="true">
          <div className="marquee-track flex w-max items-center gap-12">
            {[...TEAMS, ...TEAMS].map((t, i) => (
              <span key={`${t}-${i}`} className="whitespace-nowrap text-sm font-medium tracking-wide text-umber/70">
                {t}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
