import { useState } from 'react'
import Avatar from '../components/ui'

const seed = [
  { id: 'c1', doc: 'Summer Sustainability Report · v1.2', author: 'Elena K.', initials: 'EK', text: 'Tightened the intro to lead with the hero narrative — feels much stronger now.', time: '10:42 AM', replies: 3 },
  { id: 'c2', doc: 'Festive Campaign Brief', author: 'Marcus R.', initials: 'MR', text: 'Loved the tone. Minor tweak on section 3 — “warmth” reads a little generic.', time: '9:18 AM', replies: 1 },
  { id: 'c3', doc: 'Annual Brand Report · v1.1', author: 'Sarah L.', initials: 'SL', text: '@Ananya can you confirm the Q3 figures before we lock this section?', time: 'Yesterday', replies: 5 },
  { id: 'c4', doc: 'Winter Lookbook — Direction', author: 'Tom W.', initials: 'TW', text: 'Attaching the moodboard references for the photography direction.', time: 'Yesterday', replies: 2 },
]

export default function CommentsPage() {
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  return (
    <div className="fade-in mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Comments</h1>
        <p className="mt-1 text-sm text-umber">Conversations anchored to documents and versions</p>
      </header>

      <div className="card divide-y divide-line p-0">
        {seed.map((c) => (
          <div key={c.id} className="px-5 py-5">
            <div className="flex items-start gap-3">
              <Avatar initials={c.initials} size="md" tone="tint" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink">{c.author}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-umber/70">{c.time}</span>
                  <span className="ml-auto rounded border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-teal">
                    {c.doc}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{c.text}</p>
                <div className="mt-3 flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-xs text-umber transition-colors hover:text-teal">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M1.5 3A1.5 1.5 0 0 1 3 1.5h10A1.5 1.5 0 0 1 14.5 3v6A1.5 1.5 0 0 1 13 10.5H6l-4 3v-9.5Z" strokeLinejoin="round" />
                    </svg>
                    Reply ({c.replies})
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-umber transition-colors hover:text-teal">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M8 2.5c-3 0-5.5 2-5.5 4.5 0 1.6 1 3 2.6 3.8-.2 1-.7 1.8-1.6 2.4 1.7.2 3-.7 3.7-1.6.3 0 .5.1.8.1 3 0 5.5-2 5.5-4.7S11 2.5 8 2.5Z" strokeLinejoin="round" />
                    </svg>
                    Reply in chat
                  </button>
                </div>
                {/* Reply composer */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={drafts[c.id] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                    placeholder="Write a reply…"
                    className="input !h-9 !py-0 flex-1"
                  />
                  <button className="btn-primary !h-9 !px-3.5">Send</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
