import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/** Full-bleed dark CTA — the one espresso moment (cta-02 pattern, teal glow accent). */
export default function CtaBlock() {
  return (
    <section className="relative overflow-hidden bg-ink py-32 text-canvas">
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-ink via-transparent to-ink" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-[clamp(2.8rem,7vw,5.5rem)] leading-[1.02] tracking-[-0.015em]">
          Your next project
          <br />
          remembers everything.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-canvas/70">
          Bring your team's briefs, reviews and decisions into one calm workspace — today.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 px-2 sm:gap-4 sm:px-0">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-teal px-7 py-3.5 text-sm font-semibold text-on-accent shadow-glow transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] sm:px-8 sm:py-4"
          >
            Start free
            <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-canvas/25 px-7 py-3.5 text-sm font-semibold text-canvas transition-colors duration-300 hover:border-teal hover:text-teal sm:px-8 sm:py-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}
