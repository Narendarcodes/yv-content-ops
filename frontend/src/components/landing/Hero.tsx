import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { gsap, EASE_EXPO } from '../../lib/landing/motion'
import ParticleField from './ParticleField'

/** Self-drawing SVG underline swoosh (cta-02 / hero-01 signature). */
function Swoosh() {
  const path = useRef<SVGPathElement>(null)
  useEffect(() => {
    const el = path.current
    if (!el) return
    const len = el.getTotalLength()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    gsap.set(el, { strokeDasharray: len, strokeDashoffset: len })
    gsap.to(el, { strokeDashoffset: 0, duration: 0.9, delay: 1.1, ease: 'power2.inOut' })
  }, [])
  return (
    <svg className="pointer-events-none absolute -bottom-3 left-1/2 h-[0.35em] w-[104%] -translate-x-1/2 overflow-visible" viewBox="0 0 400 24" fill="none" preserveAspectRatio="none">
      <path
        ref={path}
        d="M6 16 C 80 4, 150 22, 210 12 S 340 8, 394 14"
        stroke="var(--color-teal)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Floating social-proof avatar card (hero-15 / cta-02 human layer). */
const FLOATERS = [
  { label: 'Brief locked', detail: 'Northwind × Folio', x: '6%', y: '18%', depth: 1.4, delay: 0 },
  { label: 'Review approved', detail: 'Spring campaign', x: '82%', y: '14%', depth: 1.1, delay: 0.4 },
  { label: 'Scheduled', detail: '12 assets · next week', x: '10%', y: '66%', depth: 0.9, delay: 0.8 },
  { label: '+3 revisions merged', detail: 'Q3 launch kit', x: '84%', y: '62%', depth: 1.25, delay: 1.2 },
]

export default function Hero() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) return
      // staggered entrance: eyebrow -> headline lines -> sub -> ctas -> floaters
      gsap.fromTo(
        '[data-hero-rise]',
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: EASE_EXPO, stagger: 0.09, delay: 0.15 },
      )
      // floating cards: bob loops + multi-depth pointer parallax
      const floaters = gsap.utils.toArray<HTMLElement>('[data-floater]')
      floaters.forEach((f) => {
        gsap.to(f, {
          y: '+=-12',
          duration: 2.6 + Math.random(),
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: Number(f.dataset.delay ?? 0),
        })
      })
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        floaters.forEach((f) => {
          const d = Number(f.dataset.depth ?? 1)
          gsap.to(f, { x: nx * 26 * d, duration: 1.2, ease: 'power2.out' })
          gsap.to(f, { yPercent: ny * 8 * d, duration: 1.2, ease: 'power2.out' })
        })
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      return () => window.removeEventListener('pointermove', onMove)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      <ParticleField className="absolute inset-0 z-0" density={0.55} opacity={0.28} />
      {/* left-biased cream scrim (Imprint recipe) keeps type legible over the field */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-canvas via-canvas/80 to-transparent" />

      {/* human layer */}
      <div className="absolute inset-0 z-[2] hidden lg:block" aria-hidden="true">
        {FLOATERS.map((f) => (
          <div
            key={f.label}
            data-floater
            data-depth={f.depth}
            data-delay={f.delay}
            className="absolute rounded-2xl border border-line bg-surface/90 px-4 py-3 shadow-card backdrop-blur-sm"
            style={{ left: f.x, top: f.y }}
          >
            <p className="text-xs font-semibold text-ink">{f.label}</p>
            <p className="mt-0.5 text-[11px] text-umber">{f.detail}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold text-teal">
              just now
            </span>
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 pb-24 pt-32 text-center sm:px-6">
        <p data-hero-rise className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-umber backdrop-blur sm:px-4 sm:text-xs">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
          <span className="truncate">Content operations, without the chaos</span>
        </p>

        <h1 className="font-display text-[clamp(2.6rem,9vw,7rem)] leading-[1.02] tracking-[-0.02em] text-ink">
          <span data-hero-rise className="block">Every draft,</span>
          <span data-hero-rise className="block">
            every decision,
          </span>
          <span data-hero-rise className="relative inline-block whitespace-nowrap">
            remembered.
            <Swoosh />
          </span>
        </h1>

        <p data-hero-rise className="mx-auto mt-8 max-w-xl px-2 text-base leading-relaxed text-umber sm:px-0 sm:text-lg">
          Folio is the project memory platform for content teams — briefs, reviews,
          production and publishing in one calm, connected workspace.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas shadow-card transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] sm:px-7 sm:py-3.5"
          >
            Open the app
            <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <a
            href="#features"
            className="rounded-full border border-line-strong bg-surface/70 px-6 py-3 text-sm font-semibold text-ink backdrop-blur transition-colors duration-300 hover:border-teal hover:text-teal sm:px-7 sm:py-3.5"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  )
}
