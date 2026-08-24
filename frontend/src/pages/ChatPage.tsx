import { useEffect, useRef, useState } from 'react'
import { Info, Paperclip, Send, Plus, WifiOff } from 'lucide-react'
import Avatar from '../components/ui'
import { Skeleton, ErrorBanner } from '../components/states'
import { useViewer } from '../lib/viewer'
import { useTeam } from '../lib/data'
import { useChat } from '../lib/chat'
import type { ChatChannel } from '../lib/chat'

export default function ChatPage() {
  const viewer = useViewer()
  const chat = useChat()
  const { team, loading: teamLoading } = useTeam()

  const [channelId, setChannelId] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [newChannelOpen, setNewChannelOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [creatingChannel, setCreatingChannel] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const active: ChatChannel | undefined =
    channels_of(chat.channels, channelId) ?? chat.channels[0]
  const messages = active ? (chat.messagesByChannel[active.id] ?? []) : []
  const memberOf = (id: string) => team.find((m) => m.id === id)

  // Auto-scroll to newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length, active?.id])

  const submit = async () => {
    if (!draft.trim() || !active || sending) return
    setSending(true)
    try {
      await chat.send(active.id, active.projectId, draft)
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  const createChannel = async () => {
    if (!newChannelName.trim() || creatingChannel) return
    setCreatingChannel(true)
    try {
      const chan = await chat.createChannel(newChannelName.trim())
      setChannelId(chan.id)
      setNewChannelOpen(false)
      setNewChannelName('')
    } catch {
      /* channel create errors surface via toast-less state; keep form open */
    } finally {
      setCreatingChannel(false)
    }
  }

  return (
    <div className="fade-in flex h-[calc(100vh-140px)] gap-4">
      {/* Channel list */}
      <aside className="card hidden w-60 shrink-0 flex-col p-0 sm:flex">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-headline text-sm font-semibold tracking-tight text-ink">Channels</h2>
          <button
            onClick={() => setNewChannelOpen((v) => !v)}
            className="icon-btn icon-btn-sm"
            aria-label="New channel"
            title="New channel"
          >
            <Plus size={15} strokeWidth={1.75} />
          </button>
        </header>

        {newChannelOpen && (
          <div className="border-b border-line p-2">
            <input
              autoFocus
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void createChannel()}
              placeholder="channel-name"
              className="input !h-8 font-mono text-[12px]"
            />
            <button
              onClick={() => void createChannel()}
              disabled={!newChannelName.trim() || creatingChannel}
              className="btn-primary mt-1.5 !h-7 w-full text-[11px]"
            >
              {creatingChannel ? 'Creating…' : 'Create channel'}
            </button>
          </div>
        )}

        <ul className="flex-1 overflow-y-auto p-2">
          {chat.loading || teamLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="px-2 py-1.5">
                  <Skeleton className="h-5 w-full" />
                </li>
              ))
            : chat.channels.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setChannelId(c.id)}
                    className={`flex w-full items-center gap-2 rounded-[8px] px-3 py-2.5 text-left transition-colors ${
                      c.id === active?.id ? 'bg-tint text-teal' : 'text-ink hover:bg-ink/4'
                    }`}
                  >
                    <span className="truncate font-mono text-sm font-medium">{c.name}</span>
                  </button>
                </li>
              ))}
        </ul>
      </aside>

      {/* Messages */}
      <section className="card flex min-w-0 flex-1 flex-col p-0">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <h2 className="font-headline text-sm font-semibold tracking-tight text-ink">
              {chat.loading ? 'Loading…' : (active?.name ?? 'No channel')}
            </h2>
            {active && <p className="text-[11px] text-umber">Live · updates in real time</p>}
          </div>
          <button className="icon-btn icon-btn-sm" aria-label="Channel info">
            <Info size={16} strokeWidth={1.75} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {chat.loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : chat.error ? (
            <ErrorBanner onRetry={() => void chat.retry()} />
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-umber/60">
              No messages yet{active ? ` — say hi in ${active.name}` : ''}.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.author === viewer.id || m.author === 'me'
              const author = memberOf(m.author)
              return (
                <div key={m.id} className="flex items-start gap-3 rise-in">
                  <Avatar initials={mine ? viewer.initials : (author?.initials ?? '?')} size="sm" tone={mine ? 'ink' : 'tint'} />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-medium text-ink">{mine ? 'You' : (author?.name ?? m.author)}</span>
                      <span className="font-mono text-[10px] text-umber/70">{m.time}</span>
                      {m.pending && <span className="font-mono text-[10px] text-umber/50">sending…</span>}
                      {m.failed && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-danger">
                          <WifiOff size={10} strokeWidth={2} /> failed
                        </span>
                      )}
                    </div>
                    <p className={`mt-0.5 text-sm leading-relaxed ${m.failed ? 'text-danger' : 'text-ink/85'}`}>{m.text}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Composer */}
        <footer className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-[8px] border border-line bg-canvas/50 px-3 py-2 focus-within:border-teal/50">
            <button className="icon-btn icon-btn-sm" aria-label="Attach" disabled title="Attachments coming soon">
              <Paperclip size={15} strokeWidth={1.75} />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void submit()
                }
              }}
              placeholder={active ? `Message ${active.name}` : 'Select a channel first'}
              disabled={!active}
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-umber/70"
            />
            <button onClick={() => void submit()} disabled={!draft.trim() || !active || sending} className="btn-primary btn-xs !px-3" aria-label="Send">
              <Send size={14} strokeWidth={1.75} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}

function channels_of(channels: ChatChannel[], id: string): ChatChannel | undefined {
  return channels.find((c) => c.id === id)
}
