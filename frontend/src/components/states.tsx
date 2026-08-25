/**
 * Async UI states for yv..
 *
 * Skeletons show while real data loads, an ErrorBanner offers a retry when
 * the backend is unreachable, and EmptyState explains when there is simply
 * nothing to show. Pages should never render blank content on slow networks.
 */
import type { ReactNode } from 'react'
import { WifiOff, RefreshCw, Inbox } from 'lucide-react'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden="true" />
}

/** Row of pulse blocks matching the Dashboard stat-card grid. */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-14" />
        </div>
      ))}
    </div>
  )
}

/** Pulse rows matching list-style pages (projects, my work, members). */
export function ListSkeleton({ rows = 4, height = 'h-16' }: { rows?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`w-full ${height}`} />
      ))}
    </div>
  )
}

/** API failure with retry. */
export function ErrorBanner({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl border border-danger/25 bg-danger/5 px-6 py-8 text-center"
      role="alert"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
        <WifiOff size={18} strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-sm font-medium text-ink">Couldn&apos;t reach the server</p>
        <p className="mt-0.5 text-[13px] text-umber">
          {message || 'Check your internet connection and try again.'}
        </p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary !h-9 text-[13px]">
          <RefreshCw size={14} strokeWidth={2} />
          Retry
        </button>
      )}
    </div>
  )
}

/** Genuine "nothing here yet" state. */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-canvas/60 px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tint text-teal">
        <Inbox size={18} strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {hint && <p className="mt-0.5 text-[13px] text-umber">{hint}</p>}
      </div>
      {action}
    </div>
  )
}
