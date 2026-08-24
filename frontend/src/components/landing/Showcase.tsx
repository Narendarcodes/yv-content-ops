import { useEffect, useRef } from 'react'
import { gsap, EASE } from '../../lib/landing/motion'

const CALLOUTS = [
  { x: '8%', y: '12%', text: 'Live review status on every asset' },
  { x: '62%', y: '26%', text: 'Feedback condensed into one revision list' },
  { x: '10%', y: '68%', text: 'Full decision history, always searchable' },
]

/** Framed dashboard mockup built from Folio primitives — perspective tilt that
 *  scrubs to flat as you scroll (hero-03 depth homage, translated to product space). */
export default function Showcase() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const frame = el.querySelector<HTMLElement>('[data-frame]')
      const pins = el.querySelectorAll<HTMLElement>('[data-callout]')
      if (!frame) return

      if (!reduced) {
        gsap.fromTo(
          frame,
          { rotateX: 18, y: 60, scale: 0.94 },
          {
            rotateX: 0,
            y: 0,
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'center center', scrub: 1 },
          },
        )
      }
      gsap.fromTo(
        pins,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: EASE,
          stagger: 0.15,
          scrollTrigger: { trigger: el, start: 'top 45%', once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="relative overflow-hidden bg-cream/70 py-28" style={{ perspective: '1400px' }}>
      <div className="grain absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-teal">Inside Folio</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-center font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.05] text-ink">
          The dashboard your work deserves
        </h2>

        <div className="relative mx-auto mt-16 max-w-4xl" data-frame>
          {/* gradient-border hairline shell (Archive/Craft signature) */}
          <div className="shell-teal rounded-3xl p-1.5">
            <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
              {/* window chrome */}
              <div className="flex items-center gap-2 border-b border-line px-5 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-3 text-xs text-umber">folio · spring campaign</span>
              </div>
              {/* mock body — sidebar column only from sm up (it's display:none below) */}
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
                <aside className="hidden border-r border-line p-4 sm:block">
                  {['Dashboard', 'My work', 'Review', 'Board', 'Projects', 'Analytics'].map((item, i) => (
                    <div key={item} className={`rounded-lg px-3 py-2 text-sm ${i === 0 ? 'bg-tint font-semibold text-teal' : 'text-umber'}`}>
                      {item}
                    </div>
                  ))}
                </aside>
                <div className="min-w-0 space-y-4 p-4 sm:p-5">
                  {/* stats: stacked on mobile, 3-up from sm */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {['In review', 'In production', 'Scheduled'].map((s, i) => (
                      <div key={s} className="rounded-xl border border-line p-3">
                        <p className="text-[11px] uppercase tracking-wide text-umber">{s}</p>
                        <p className="mt-1 font-display text-2xl text-ink">{[7, 12, 5][i]}</p>
                      </div>
                    ))}
                  </div>
                  {[
                    ['Launch film final cut', 'Review · v4', '82%'],
                    ['Website hero illustrations', 'Production', '54%'],
                    ['Q3 social kit', 'Scheduled', '100%'],
                  ].map(([name, stage, pct]) => (
                    <div key={name} className="rounded-xl border border-line p-4">
                      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{name}</p>
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-tint px-2 py-0.5 text-[11px] font-semibold text-teal">{stage}</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full rounded-full bg-teal" style={{ width: pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* floating callouts */}
          {CALLOUTS.map((c) => (
            <div
              key={c.text}
              data-callout
              className="absolute z-10 hidden rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-card md:block"
              style={{ left: c.x, top: c.y }}
            >
              {c.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
