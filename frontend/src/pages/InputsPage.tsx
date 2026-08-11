import Chip, { PageHeader } from '../components/primitives'
import { inputs } from '../lib/mockData'

const sourceTone: Record<string, 'teal' | 'warning' | 'neutral' | 'success'> = {
  File: 'teal',
  Email: 'warning',
  Voice: 'success',
  Text: 'neutral',
}

const sourceIcon = (src: string) => {
  const props = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (src) {
    case 'File':
      return <svg {...props}><path d="M3 1.5h6l4 4v9H3v-13Z" /><path d="M9 1.5v4h4" /></svg>
    case 'Email':
      return <svg {...props}><rect x="1.5" y="3" width="13" height="10" rx="1.5" /><path d="m2 4.5 6 4.5 6-4.5" /></svg>
    case 'Voice':
      return <svg {...props}><path d="M8 1.5a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-5 0V4A2.5 2.5 0 0 1 8 1.5Z" /><path d="M3.5 7v1a4.5 4.5 0 0 0 9 0V7M8 12.5V15" /></svg>
    default:
      return <svg {...props}><path d="M2 4h12v8H2z" /><path d="M2 7h12" /></svg>
  }
}

export default function InputsPage() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Inputs"
        subtitle="Raw material flowing into the studio — files, emails, voice notes and more"
        actions={
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 9l2.5-6h7l2.5 6v2a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            Upload input
          </button>
        }
      />

      <div className="card overflow-hidden p-0">
        <ul className="divide-y divide-line">
          {inputs.map((input) => (
            <li key={input.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-canvas/60">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-tint text-teal">
                {sourceIcon(input.source)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-ink">{input.title}</p>
                  {input.unread && <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />}
                </div>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-umber/60">{input.time}</p>
              </div>
              <Chip label={input.source} tone={sourceTone[input.source] ?? 'neutral'} />
              <button className="btn-ghost !h-8 !px-2.5 text-umber" aria-label="Open input">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4.5 2.5 9 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
