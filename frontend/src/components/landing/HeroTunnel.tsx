import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { gsap, EASE_EXPO } from '../../lib/landing/motion'
import GalleryTunnel from './GalleryTunnel'

/** Self-drawing SVG underline swoosh (same signature as the default hero). */
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
      <path ref={path} d="M6 16 C 80 4, 150 22, 210 12 S 340 8, 394 14" stroke="var(--color-teal)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

/**
 * OriginKit hero-03 port: a real Three.js gallery tunnel (GalleryTunnel engine)
 * with yv.'s copy at the calm core. The canvas handles all depth; DOM adds a
 * radial scrim for legibility. No per-frame DOM work → no scroll flicker.
 */
export default function HeroTunnel() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) return
      gsap.fromTo(
        '[data-rise]',
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: EASE_EXPO, stagger: 0.09, delay: 0.15 },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-canvas">
      {/* the Three.js corridor (single canvas layer — GPU-composited once) */}
      <GalleryTunnel className="absolute inset-0 z-0" />

      {/* legibility scrim at the core */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(247,245,242,0.95),rgba(247,245,242,0.45)_55%,transparent_75%)]" />

      {/* copy block */}
      <div className="relative z-10 mx-auto max-w-4xl px-5 pb-24 pt-36 text-center sm:px-6">
        <p data-rise className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-umber backdrop-blur sm:px-4 sm:text-xs">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
          <span className="truncate">Content operations, without the chaos</span>
        </p>

        <h1 className="font-display text-[clamp(2.6rem,9vw,7rem)] leading-[1.02] tracking-[-0.02em] text-ink">
          <span data-rise className="block">Every draft,</span>
          <span data-rise className="block">every decision,</span>
          <span data-rise className="relative inline-block whitespace-nowrap">
            remembered.
            <Swoosh />
          </span>
        </h1>

        <p data-rise className="mx-auto mt-8 max-w-xl px-2 text-base leading-relaxed text-umber sm:px-0 sm:text-lg">
          yv. is the project memory platform for content teams — briefs, reviews,
          production and publishing in one calm, connected workspace.
        </p>

        <div data-rise className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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
