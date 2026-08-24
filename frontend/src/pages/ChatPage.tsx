import { useState } from 'react'
import { Info, Paperclip, Send } from 'lucide-react'
import Avatar from '../components/ui'
import { useViewer } from '../lib/viewer'
import { useChat, useTeam } from '../lib/data'

let teamRef: ReturnType<typeof useTeam>['team'] = []
export function setTeamRef(t: typeof teamRef) {
  teamRef = t
}
const memberOf = (id: string) => teamRef.find((m) => m.id === id)

type LocalMessage = { id: string; author: string; text: string; time: string }

export default function ChatPage() {
  const viewer = useViewer()
  const { channels, messagesByChannel } = useChat()
  const { team } = useTeam()
  setTeamRef(team)

  const [channel, setChannel] = useState('')
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<Record<string, LocalMessage[]>>({})
  const activeChannelId = channel && channels.some((c) => c.id === channel) ? channel : channels[0]?.id ?? ''
  const active = channels.find((c) => c.id === activeChannelId)
  const base = messagesByChannel[activeChannelId] ?? []
  const messages = [...base, ...(sent[activeChannelId] ?? [])]

  const send = () => {
    if (!draft.trim()) return
    const msg: LocalMessage = {
      id: `local-${Date.now()}`,
      author: viewer.id,
      text: draft.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setSent((s) => ({ ...s, [activeChannelId]: [...(s[activeChannelId] ?? []), msg] }))
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
          {channels.map((c) => (
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
            <h2 className="font-headline text-sm font-semibold tracking-tight text-ink">{active?.name ?? 'No channel'}</h2>
            <p className="text-[11px] text-umber">{active?.desc ?? ''}</p>
          </div>
          <button className="icon-btn icon-btn-sm" aria-label="Channel info">
            <Info size={16} strokeWidth={1.75} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-umber/60">No messages yet. Start a conversation by selecting a channel.</p>
          ) : (
            messages.map((m) => {
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
            })
          )}
        </div>

        {/* Composer */}
        <footer className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-[8px] border border-line bg-canvas/50 px-3 py-2 focus-within:border-teal/50">
            <button className="icon-btn icon-btn-sm" aria-label="Attach">
              <Paperclip size={15} strokeWidth={1.75} />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Message ${active?.name ?? ''}`}
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-umber/70"
            />
            <button onClick={send} disabled={!draft.trim()} className="btn-primary btn-xs !px-3" aria-label="Send">
              <Send size={14} strokeWidth={1.75} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
