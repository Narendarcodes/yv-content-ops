import { useState } from 'react'
import Chip, { statusTone, PageHeader } from '../components/primitives'
import { AvatarStack } from '../components/ui'
import { publications } from '../lib/mockData'

const tabs = ['All', 'Live', 'Scheduled', 'Draft']

export default function PublicationsPage() {
  const [tab, setTab] = useState('All')
  const filtered = publications.filter((p) => tab === 'All' || p.status === tab)

  return (
    <div className="fade-in">
      <PageHeader
        title="Publications"
        subtitle="Everything the studio has shipped, or is about to"
        actions={
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New publication
          </button>
        }
      />

      <div className="mb-5 flex rounded-[8px] border border-line bg-surface p-0.5 w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-[6px] px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              tab === t ? 'bg-ink text-on-accent' : 'text-umber hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((pub) => (
          <article key={pub.id} className="card overflow-hidden p-0 rise-in">
            <div className="flex h-28 items-center justify-center bg-[#EFEBE3]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-umber)" strokeWidth="1.3">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" />
                <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
              </svg>
            </div>
            <div className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <Chip label={pub.status} tone={statusTone(pub.status)} dot />
                <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{pub.date}</span>
              </div>
              <h3 className="font-headline text-[15px] font-semibold leading-snug tracking-tight text-ink">{pub.title}</h3>
              <div className="mt-4 flex items-center justify-between">
                <AvatarStack initials={pub.authors} max={3} />
                <div className="flex gap-1">
                  {pub.platforms.map((pl) => (
                    <span key={pl} className="rounded border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-umber/70">
                      {pl}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <p className="mt-8 text-center text-sm text-umber">No publications in this state.</p>}
    </div>
  )
}
