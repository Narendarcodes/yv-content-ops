import { useState } from 'react'
import { Link } from 'react-router-dom'
import Chip, { PageHeader } from '../components/primitives'
import { scheduledPosts } from '../lib/mockData'

export default function SchedulePublishPage() {
  const [url, setUrl] = useState('')
  const [recorded, setRecorded] = useState<string | null>(null)

  return (
    <div className="fade-in space-y-8">
      <PageHeader
        title="Schedule & Publish"
        subtitle="Plan when content goes live and record where it was posted."
      />

      {/* Coming soon banner */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-warning/10 text-warning">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h2 className="font-headline text-lg font-semibold tracking-tight text-ink">Auto-publishing to social media — coming soon</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-umber">
                One-tap publishing straight to Instagram and YouTube is still in development (an integration with a scheduling
                service is on the roadmap). Until then, the team records posts manually right here — the project keeps the
                link back to the live post.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-ink/80">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal" /> Schedule a live date/time on approved projects</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal" /> Manually record the post URL once it goes live</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-warning" /> One-tap Instagram / YouTube publishing — <span className="font-medium text-warning">in development</span></li>
              </ul>
            </div>
          </div>
          <Chip label="Coming soon" tone="warning" />
        </div>
      </section>

      {/* Scheduled */}
      <section className="card p-0">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Scheduled projects</h2>
          <span className="font-mono text-[11px] text-umber/60">{scheduledPosts.length} upcoming</span>
        </header>
        <ul className="divide-y divide-line">
          {scheduledPosts.map((sp) => {
            return (
              <li key={sp.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/projects/${sp.projectId}`} className="text-sm font-medium text-ink hover:text-teal">{sp.title}</Link>
                  <p className="text-xs text-umber">{sp.platform} · {sp.version}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-ink">{sp.scheduledAt}</p>
                  <Chip label="Scheduled" tone="warning" />
                </div>
              </li>
            )
          })}
          {!scheduledPosts.length && <li className="px-5 py-8 text-center text-sm text-umber">Nothing scheduled yet.</li>}
        </ul>
      </section>

      {/* Manual record */}
      <section className="card p-5">
        <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Record a published post</h2>
        <p className="mt-1 text-sm text-umber">Once a scheduled project goes live, paste the post link here to attach it to the project.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://instagram.com/p/… or https://youtube.com/watch?v=…"
            className="input min-w-72 flex-1"
          />
          <button className="btn-primary" onClick={() => { if (url.trim()) { setRecorded(url.trim()); setUrl('') } }} disabled={!url.trim()}>
            Record link
          </button>
        </div>
        {recorded && (
          <p className="mt-3 rounded-[8px] bg-tint/60 px-3 py-2 text-sm text-ink">
            Recorded: <a href={recorded} target="_blank" rel="noreferrer" className="font-medium text-teal hover:underline">{recorded}</a>
          </p>
        )}
      </section>
    </div>
  )
}
