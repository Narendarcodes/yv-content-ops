import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger, EASE } from '../../lib/landing/motion'

/** Batch-reveals every [data-reveal] descendant when the section scrolls into view. */
export function useRevealScope<T extends HTMLElement>() {
  const scope = useRef<T>(null)
  useEffect(() => {
    const el = scope.current
    if (!el) return
    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll<HTMLElement>('[data-reveal]')
      if (!targets.length) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) {
        gsap.set(targets, { clearProps: 'all' })
        return
      }
      gsap.fromTo(
        targets,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.64,
          ease: EASE,
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 78%', once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])
  return scope
}

/** Wrapper that marks a block for reveal + provides the reveal scope. */
export default function Reveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const scope = useRevealScope<HTMLDivElement>()
  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}

/** Odometer count-up for stat numbers (cta-02 pattern). */
export function CountUp({
  to,
  suffix = '',
  duration = 1.6,
}: {
  to: number
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obj = { v: 0 }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      el.textContent = `${to}${suffix}`
      return
    }
    const tween = gsap.to(obj, {
      v: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = `${Math.round(obj.v)}${suffix}`
      },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [to, suffix, duration])
  return <span ref={ref}>0{suffix}</span>
}

export { ScrollTrigger }
