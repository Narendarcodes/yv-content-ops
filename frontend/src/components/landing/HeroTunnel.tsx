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

/** Gallery frames hung on the corridor walls, receding into depth.
 *  Positioned with left/top % of the scene; transform reserved for 3D only. */
const WALL_FRAMES = [
  { left: '4%', top: '36%', z: -300, ry: 30, w: 220, h: 290, hue: 'teal' },
  { left: '96%', top: '28%', z: -420, ry: -28, w: 250, h: 180, hue: 'amber' },
  { left: '2%', top: '72%', z: -560, ry: 36, w: 190, h: 260, hue: 'umber' },
  { left: '98%', top: '66%', z: -640, ry: -34, w: 200, h: 270, hue: 'cream' },
  { left: '11%', top: '18%', z: -800, ry: 20, w: 160, h: 120, hue: 'amber' },
  { left: '90%', top: '80%', z: -900, ry: -18, w: 160, h: 120, hue: 'teal' },
]

const FRAME_FILLS: Record<string, string> = {
  teal: 'linear-gradient(150deg, #e6f2f0, #9fc9c2 55%, #0f766e)',
  amber: 'linear-gradient(150deg, #f7f0dd, #ecd9a8 55%, #c8a45a)',
  umber: 'linear-gradient(150deg, #efe9df, #cbbfa8 55%, #78716c)',
  cream: 'linear-gradient(150deg, #ffffff, #efebe3 60%, #d8d0bf)',
}

const RING_COUNT = 16
const RING_GAP = 220 // px between rings == dolly loop distance (seamless repeat)

/**
 * OriginKit hero-03 homage: an infinite cream gallery corridor — converging
 * rails + nested rings to a central vanishing point, framed artwork on the
 * walls, slow dolly-forward motion, pointer-parallax tilt, copy at the calm core.
 *
 * GPU hygiene (prevents scroll flicker): bounded layer sizes, will-change hints,
 * backface culling, paint containment, and the dolly pauses when off-screen.
 */
export default function HeroTunnel() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    let cleanupVisibility = () => {}
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // entrance
      gsap.fromTo(
        '[data-rise]',
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: EASE_EXPO, stagger: 0.09, delay: 0.15 },
      )

      if (reduced) return

      // slow infinite dolly down the corridor — exactly one ring-gap per loop,
      // so the repeat point is invisible. Pauses whenever the hero is off-screen
      // or the tab is hidden (keeps scrolling smooth elsewhere on the page).
      const tunnel = el.querySelector<HTMLElement>('[data-tunnel]')
      let dolly: gsap.core.Tween | null = null
      if (tunnel) {
        dolly = gsap.fromTo(
          tunnel,
          { z: 0 },
          { z: RING_GAP, duration: 5, ease: 'none', repeat: -1, paused: true },
        )
        const io = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !document.hidden) dolly?.play()
          else dolly?.pause()
        })
        io.observe(el)
        const onVis = () => {
          if (document.hidden) dolly?.pause()
        }
        document.addEventListener('visibilitychange', onVis)
        cleanupVisibility = () => {
          io.disconnect()
          document.removeEventListener('visibilitychange', onVis)
        }
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
      return () => {
        window.removeEventListener('pointermove', onMove)
        dolly?.kill()
      }
    }, el)
    return () => {
      cleanupVisibility()
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-canvas"
      style={{ contain: 'paint' }}
    >
      {/* converging rails: straight lines from the frame edges to the exact
          vanishing point — the strongest static depth cue available.
          viewBox maps 0..100 over the whole area; non-scaling strokes keep
          them 1px crisp despite the stretch. */}
      <svg className="absolute inset-0 z-[1] h-full w-full" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[
          'M0,0 L50,50', 'M25,0 L50,50', 'M75,0 L50,50', 'M100,0 L50,50',
          'M0,25 L50,50', 'M100,25 L50,50',
          'M0,50 L50,50', 'M100,50 L50,50',
          'M0,75 L50,50', 'M100,75 L50,50',
          'M0,100 L50,50', 'M25,100 L50,50', 'M75,100 L50,50', 'M100,100 L50,50',
        ].map((d) => (
          <path key={d} d={d} vectorEffect="non-scaling-stroke" stroke="rgba(28,25,23,0.10)" strokeWidth="1" fill="none" />
        ))}
        {/* teal glow at the vanishing point */}
        <circle cx="50" cy="50" r="1.6" fill="rgba(15,118,110,0.45)" />
      </svg>

      {/* the corridor */}
      <div data-scene className="absolute inset-0 z-[2] [perspective:1100px]" style={{ willChange: 'transform' }}>
        <div data-tunnel className="absolute inset-0 [transform-style:preserve-3d]" style={{ willChange: 'transform' }}>
          {/* receding corridor rings */}
          {Array.from({ length: RING_COUNT }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 rounded-lg"
              style={{
                width: '170vmax',
                height: '170vmax',
                marginLeft: '-85vmax',
                marginTop: '-85vmax',
                transform: `translateZ(${-i * RING_GAP}px)`,
                border: `2px solid rgba(28,25,23,${Math.max(0.07, 0.24 - i * 0.012)})`,
                backgroundImage:
                  i < 4
                    ? 'linear-gradient(to right, rgba(28,25,23,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,25,23,0.06) 1px, transparent 1px)'
                    : undefined,
                backgroundSize: '12vmax 12vmax',
                backfaceVisibility: 'hidden',
              }}
            />
          ))}

          {/* wall frames */}
          {WALL_FRAMES.map((f, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="absolute rounded-lg p-1.5 shadow-[0_24px_48px_-16px_rgba(28,25,23,0.3)]"
              style={{
                left: f.left,
                top: f.top,
                width: f.w,
                height: f.h,
                marginLeft: -f.w / 2,
                marginTop: -f.h / 2,
                background: '#ffffff',
                transform: `translateZ(${f.z}px) rotateY(${f.ry}deg)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="h-full w-full rounded-md" style={{ background: FRAME_FILLS[f.hue] }} />
            </div>
          ))}
        </div>
      </div>

      {/* legibility scrim at the core + edge vignette for depth */}
      <div className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_52%_42%_at_50%_50%,rgba(247,245,242,0.94),transparent_74%)]" />
      <div className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_85%_85%_at_50%_50%,transparent_48%,rgba(28,25,23,0.16)_100%)]" />

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
