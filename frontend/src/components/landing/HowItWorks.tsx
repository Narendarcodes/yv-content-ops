import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/landing/motion'

const STEPS = [
  { n: '01', title: 'Brief', body: 'Clients answer a structured brief. Requirements land clean, versioned and searchable.' },
  { n: '02', title: 'Produce', body: 'The team moves work across a kanban tuned for content pipelines, with context one click away.' },
  { n: '03', title: 'Review', body: 'Rounds get locked, feedback is condensed into one list, revisions are tracked to the pixel.' },
  { n: '04', title: 'Ship', body: 'Approvals are recorded, assets scheduled, publications tracked — and every decision remembered.' },
]

/** Pinned horizontal-scroll section (Lenis + ScrollTrigger). */
export default function HowItWorks() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const track = el.querySelector<HTMLElement>('[data-track]')
      if (!track) return

      const mq = window.matchMedia('(min-width: 768px)')
      if (reduced || !mq.matches) {
        // below md (or reduced motion): pure CSS snap carousel, no GSAP pinning
        return
      }

      const distance = () => track.scrollWidth - el.clientWidth
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      })
      return () => tween.scrollTrigger?.kill()
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="how relative overflow-hidden py-24">
      <div className="grain absolute inset-0" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">How it works</p>
        <h2 className="mt-4 max-w-xl font-display text-[clamp(2.2rem,6vw,4rem)] leading-[1.05] text-ink">
          From brief to published, in four moves
        </h2>
      </div>

      {/* Mobile (<md): swipeable snap carousel · md+: GSAP pinned horizontal scroll */}
      <div data-viewport className="mt-14 overflow-hidden px-6 md:px-[max(1.5rem,calc((100vw-72rem)/2))]">
        <div data-track className="flex w-max gap-6 max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto max-md:pb-4 md:gap-8">
          {STEPS.map((s) => (
            <article key={s.n} className="w-[82vw] max-w-[420px] shrink-0 snap-center rounded-[22px] bg-surface p-8 shadow-card sm:w-[420px]">
              <p className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-none text-teal/25">{s.n}</p>
              <h3 className="mt-4 font-display text-3xl text-ink">{s.title}</h3>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-umber">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
