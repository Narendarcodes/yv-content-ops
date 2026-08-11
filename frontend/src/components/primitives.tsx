import type { ReactNode } from 'react'

export { PageHeader } from './ui'

const tones = {
  teal: 'bg-tint text-teal',
  neutral: 'bg-ink/5 text-umber',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
} as const

export default function Chip({
  label,
  tone = 'neutral',
  dot = false,
}: {
  label: string
  tone?: keyof typeof tones
  dot?: boolean
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 h-6 text-[11px] font-mono font-medium ${tones[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />}
      {label}
    </span>
  )
}

export function statusTone(status: string): keyof typeof tones {
  const s = status.toLowerCase()
  if (['active', 'live', 'approved', 'paid', 'published', 'current'].some((k) => s.includes(k))) return 'teal'
  if (['in review', 'pending', 'scheduled', 'sent'].some((k) => s.includes(k))) return 'warning'
  if (['overdue', 'expired', 'void', 'danger'].some((k) => s.includes(k))) return 'danger'
  if (['draft', 'inactive', 'backlog'].some((k) => s.includes(k))) return 'neutral'
  return 'success'
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[8vh]">
      <div className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        className={`modal-in relative w-full ${width} rounded-[8px] border border-line bg-surface shadow-pop`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-headline text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <button onClick={onClose} className="btn-ghost !h-8 !px-2 text-umber" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="fade-in flex flex-col items-center justify-center rounded-[8px] border border-dashed border-line bg-canvas/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-tint text-teal">{icon}</div>
      <h3 className="font-headline text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-umber">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'teal',
}: {
  label: string
  value: string | number
  icon: ReactNode
  tone?: 'teal' | 'warning' | 'success' | 'danger'
}) {
  const tones = {
    teal: 'bg-tint text-teal',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-umber/70">{label}</p>
          <p className="mt-2 font-mono text-3xl font-medium text-ink">{value}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${tones[tone]}`}>{icon}</span>
      </div>
    </div>
  )
}
