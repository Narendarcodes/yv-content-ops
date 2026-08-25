import {
  ClipboardList, BrainCircuit, LockKeyhole, KanbanSquare, BadgeCheck, CalendarClock, ArrowUpRight,
} from 'lucide-react'
import Reveal from './Reveal'

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Structured briefs',
    body: 'Every project starts from a living brief clients can actually fill in — no more hunting through email threads.',
  },
  {
    icon: BrainCircuit,
    title: 'Project memory',
    body: 'Decisions, feedback and context stay attached to the work. New teammates ramp up by reading history, not asking around.',
    highlight: true,
  },
  {
    icon: LockKeyhole,
    title: 'Review lock & summarize',
    body: 'Freeze a review round and let yv. condense scattered feedback into one clear revision list.',
  },
  {
    icon: KanbanSquare,
    title: 'Kanban production',
    body: 'Move work from assigned to done on a board tuned for content pipelines, with statuses that mirror real life.',
  },
  {
    icon: BadgeCheck,
    title: 'Approvals that stick',
    body: 'Client sign-off is recorded, versioned and searchable — nobody re-approves the same asset twice.',
  },
  {
    icon: CalendarClock,
    title: 'Schedule & publish',
    body: 'Plan the calendar, hand off final files and track publication without leaving the project.',
  },
]

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-28">
      <div className="grain absolute inset-0" aria-hidden="true" />
      {/* cursor-spotlight dot grid (hero-15) */}
      <div className="dot-grid absolute inset-0 opacity-[0.5]" aria-hidden="true" />

      <Reveal className="relative mx-auto max-w-6xl px-6">
        <p data-reveal className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
          The workspace
        </p>
        <h2 data-reveal className="mt-4 max-w-2xl font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.05] tracking-[-0.01em] text-ink">
          One calm system for the whole content lifecycle
        </h2>
        <p data-reveal className="mt-5 max-w-xl text-lg leading-relaxed text-umber">
          Six connected modules replace the sprawl of docs, chats and spreadsheets your
          team juggles today.
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              data-reveal
              className={`group relative transition-transform duration-300 hover:-translate-y-1 ${
                f.highlight
                  ? 'shell-teal' // gradient hairline wrapper — inner card supplies padding & surface
                  : 'rounded-[22px] bg-surface p-7 shadow-card'
              }`}
            >
              {f.highlight ? (
                <div className="flex h-full flex-col rounded-[21px] bg-surface p-7">
                  <div className="inline-flex self-start rounded-xl bg-tint p-3 text-teal">
                    <f.icon size={22} strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 flex items-center gap-2 text-lg font-semibold text-ink">
                    {f.title}
                    <ArrowUpRight
                      size={16}
                      className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-60"
                    />
                  </h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-umber">{f.body}</p>
                </div>
              ) : (
                <>
                  <div className="inline-flex rounded-xl bg-canvas p-3 text-ink">
                    <f.icon size={22} strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 flex items-center gap-2 text-lg font-semibold text-ink">
                    {f.title}
                    <ArrowUpRight
                      size={16}
                      className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-60"
                    />
                  </h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-umber">{f.body}</p>
                </>
              )}
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
