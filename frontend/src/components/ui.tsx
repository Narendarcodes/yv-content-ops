import type { ReactNode } from 'react'

const tones: Record<string, string> = {
  teal: 'bg-teal text-on-accent',
  tint: 'bg-tint text-teal',
  ink: 'bg-ink/80 text-on-accent',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
}

export default function Avatar({
  initials,
  size = 'md',
  tone = 'teal',
  className = '',
}: {
  initials: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  tone?: keyof typeof tones
  className?: string
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
    xl: 'h-20 w-20 text-2xl',
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-mono font-medium ${sizes[size]} ${tones[tone]} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

export function AvatarStack({ initials, max = 3 }: { initials: string[]; max?: number }) {
  const shown = initials.slice(0, max)
  const extra = initials.length - shown.length
  return (
    <span className="flex -space-x-2">
      {shown.map((ini, i) => (
        <span key={i} className="rounded-full ring-2 ring-surface transition-transform hover:-translate-y-0.5">
          <Avatar initials={ini} size="xs" tone={i % 2 === 0 ? 'teal' : 'tint'} />
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink/5 font-mono text-[9px] text-umber ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </span>
  )
}

export function StatusDot({ tone = 'teal' }: { tone?: string }) {
  const color: Record<string, string> = {
    teal: 'bg-teal',
    warning: 'bg-warning',
    success: 'bg-success',
    danger: 'bg-danger',
    neutral: 'bg-umber/50',
  }
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color[tone] ?? color.teal}`} aria-hidden="true" />
}

export function Spacer({ h = 4 }: { h?: number }) {
  return <div style={{ height: `${h * 4}px` }} aria-hidden="true" />
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-headline text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-umber">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Section heading used inside cards — consistent editorial rhythm */
export function SectionHeading({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <h2 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      {action}
    </div>
  )
}
