import { useState } from 'react'
import Avatar from '../components/ui'
import { chatChannels, chatMessages, team } from '../lib/mockData'
import { useViewer } from '../lib/viewer'

const memberOf = (id: string) => team.find((m) => m.id === id)

export default function ChatPage() {
  const viewer = useViewer()
  const [channel, setChannel] = useState(chatChannels[0].id)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState(chatMessages)
  const active = chatChannels.find((c) => c.id === channel)!

  const send = () => {
    if (!draft.trim()) return
    setMessages((m) => [
      ...m,
      {
        id: `local-${Date.now()}`,
        author: viewer.id,
        text: draft.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setDraft('')
  }

  return (
    <div className="fade-in flex h-[calc(100vh-140px)] gap-4">
      {/* Channel list */}
      <aside className="card hidden w-60 shrink-0 flex-col p-0 sm:flex">
        <header className="border-b border-line px-4 py-3">
          <h2 className="font-headline text-sm font-semibold tracking-tight text-ink">Channels</h2>
        </header>
        <ul className="flex-1 overflow-y-auto p-2">
          {chatChannels.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setChannel(c.id)}
                className={`flex w-full items-center gap-2 rounded-[8px] px-3 py-2.5 text-left transition-colors ${
                  c.id === channel ? 'bg-tint text-teal' : 'text-ink hover:bg-ink/4'
                }`}
              >
                <span className="font-mono text-sm font-medium">{c.name}</span>
                {c.unread > 0 && (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 font-mono text-[10px] text-on-accent">
                    {c.unread}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Messages */}
      <section className="card flex min-w-0 flex-1 flex-col p-0">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <h2 className="font-headline text-sm font-semibold tracking-tight text-ink">{active.name}</h2>
            <p className="text-[11px] text-umber">{active.desc}</p>
          </div>
          <button className="btn-ghost !h-8 !px-2.5 text-umber" aria-label="Channel info">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 7.5v4M8 4.5v.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((m) => {
            const author = memberOf(m.author)
            const mine = m.author === viewer.id
            return (
              <div key={m.id} className="flex items-start gap-3 rise-in">
                <Avatar initials={author?.initials ?? '?'} size="sm" tone={mine ? 'ink' : 'tint'} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-medium text-ink">{mine ? 'You' : (author?.name ?? m.author)}</span>
                    <span className="font-mono text-[10px] text-umber/70">{m.time}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink/85">{m.text}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Composer */}
        <footer className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-[8px] border border-line bg-canvas/50 px-3 py-2 focus-within:border-teal/50">
            <button className="text-umber/50 transition-colors hover:text-ink" aria-label="Attach">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M8 3v6.5a2.5 2.5 0 0 0 5 0V5.5M8 3a4.5 4.5 0 0 1 4.5 4.5v3a4.5 4.5 0 0 1-9 0v-6" strokeLinecap="round" />
              </svg>
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Message ${active.name}`}
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-umber/70"
            />
            <button onClick={send} className="btn-primary !h-8 !px-3" aria-label="Send">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1.5 6.5 12.5 1 9.5 12.5 6.5 7.5 1.5 6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
