import Reveal from './Reveal'

const QUOTES = [
  {
    quote: 'We stopped losing client decisions in Slack. yv. remembers the "why" behind every asset — our revisions dropped by a third.',
    name: 'Maya Ortiz',
    role: 'Creative Director, Halcyon Media',
  },
  {
    quote: 'The review lock is the feature I didn\'t know I needed. One condensed feedback list per round instead of forty scattered comments.',
    name: 'Daniel Reyes',
    role: 'Founder, Paper & Pixel',
  },
  {
    quote: 'Onboarding a new writer used to take two weeks of shoulder-taps. Now they read the project memory and just… start.',
    name: 'Priya Nair',
    role: 'Head of Content, Northwind Studio',
  },
]

export default function Testimonials() {
  return (
    <section id="stories" className="relative py-28">
      <div className="grain absolute inset-0" aria-hidden="true" />
      <Reveal className="relative mx-auto max-w-6xl px-6">
        <p data-reveal className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
          Stories
        </p>
        <h2 data-reveal className="mt-4 max-w-2xl font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.05] text-ink">
          Teams that stopped forgetting
        </h2>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure
              key={q.name}
              data-reveal
              className="flex flex-col justify-between rounded-[22px] bg-surface p-7 shadow-card transition-transform duration-300 hover:-translate-y-1"
            >
              <blockquote className="text-[15px] leading-relaxed text-ink">
                <span aria-hidden className="mr-1 font-display text-4xl leading-none text-teal">“</span>
                {q.quote}
              </blockquote>
              <figcaption className="mt-7 border-t border-line pt-4">
                <p className="text-sm font-semibold text-ink">{q.name}</p>
                <p className="mt-0.5 text-xs text-umber">{q.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
