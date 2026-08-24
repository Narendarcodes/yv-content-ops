import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { gsap, EASE_EXPO } from '../../lib/landing/motion'

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

/** Gallery frames hung on the corridor walls, receding into depth. */
const WALL_FRAMES = [
  { x: '-46%', y: '30%', z: -300, ry: 28, w: 200, h: 260, hue: 'teal' },
  { x: '46%', y: '24%', z: -420, ry: -24, w: 230, h: 170, hue: 'amber' },
  { x: '-52%', y: '62%', z: -560, ry: 32, w: 180, h: 240, hue: 'umber' },
  { x: '54%', y: '58%', z: -640, ry: -30, w: 190, h: 250, hue: 'cream' },
  { x: '-38%', y: '18%', z: -800, ry: 20, w: 150, h: 110, hue: 'amber' },
  { x: '40%', y: '70%', z: -900, ry: -18, w: 150, h: 110, hue: 'teal' },
]

const FRAME_FILLS: Record<string, string> = {
  teal: 'linear-gradient(150deg, #e6f2f0, #9fc9c2 55%, #0f766e)',
  amber: 'linear-gradient(150deg, #f7f0dd, #ecd9a8 55%, #c8a45a)',
  umber: 'linear-gradient(150deg, #efe9df, #cbbfa8 55%, #78716c)',
  cream: 'linear-gradient(150deg, #ffffff, #efebe3 60%, #d8d0bf)',
}

/**
 * OriginKit hero-03 homage: an infinite cream gallery corridor — perspective
 * grid planes converging to a central vanishing point, framed artwork on the
 * walls, slow dolly-forward motion, pointer-parallax tilt, copy at the calm core.
 */
export default function HeroTunnel() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // entrance
      gsap.fromTo(
        '[data-rise]',
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: EASE_EXPO, stagger: 0.09, delay: 0.15 },
      )

      if (reduced) return

      // slow infinite dolly down the corridor
      const tunnel = el.querySelector<HTMLElement>('[data-tunnel]')
      if (tunnel) {
        gsap.fromTo(
          tunnel,
          { z: 0 },
          { z: 300, duration: 14, ease: 'none', repeat: -1 },
        )
      }

      // pointer parallax tilt on the whole scene
      const scene = el.querySelector<HTMLElement>('[data-scene]')
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        if (scene) {
          gsap.to(scene, { rotateY: nx * 4, rotateX: -ny * 3, duration: 1.4, ease: 'power2.out', transformPerspective: 1200 })
        }
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      return () => window.removeEventListener('pointermove', onMove)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-canvas">
      {/* the corridor */}
      <div data-scene className="absolute inset-0 [perspective:1100px]">
        <div data-tunnel className="absolute inset-0 [transform-style:preserve-3d]">
          {/* receding grid planes */}
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 border border-ink/[0.07]"
              style={{
                width: '160vmax',
                height: '160vmax',
                transform: `translate(-50%, -50%) translateZ(${-i * 220}px)`,
                backgroundImage:
                  'linear-gradient(to right, rgba(28,25,23,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,25,23,0.05) 1px, transparent 1px)',
                backgroundSize: '12vmax 12vmax',
              }}
            />
          ))}

          {/* wall frames */}
          {WALL_FRAMES.map((f, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 rounded-lg p-1.5 shadow-[0_24px_48px_-16px_rgba(28,25,23,0.25)]"
              style={{
                width: f.w,
                height: f.h,
                background: '#ffffff',
                transform: `translate(-50%, -50%) translate(${f.x}, ${f.y}) translateZ(${f.z}px) rotateY(${f.ry}deg)`,
              }}
            >
              <div className="h-full w-full rounded-md" style={{ background: FRAME_FILLS[f.hue] }} />
            </div>
          ))}
        </div>
      </div>

      {/* legibility scrim at the core */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(247,245,242,0.92),transparent_75%)]" />

      {/* copy block */}
      <div className="relative z-10 mx-auto max-w-4xl px-5 pb-24 pt-32 text-center sm:px-6">
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
          Folio is the project memory platform for content teams — briefs, reviews,
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
