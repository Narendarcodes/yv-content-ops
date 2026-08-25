import { Link } from 'react-router-dom'

/**
 * yv. brand logo — geometry from the ChatGPT-delivered SVGs (public/yv-mark.svg):
 * angular "y" (apex ∨ + vertical stem) and "v" (∨), sharing a baseline, with the
 * dot as a separate teal circle. Wordmark "yv." pairs beside it in Instrument Serif.
 * Colors: ink #1C1917, teal #0F766E (the app theme tokens).
 */
export default function BrandLogo({
  size = 36,
  to = '/',
  className = '',
  withWordmark = true,
}: {
  size?: number
  to?: string
  className?: string
  withWordmark?: boolean
}) {
  return (
    <Link to={to} aria-label="yv. home" className={`group inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M12 18 L20.5 34 L29 18 M20.5 34 L20.5 47"
          stroke="var(--color-ink)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M34 18 L43 40 L53 18"
          stroke="var(--color-ink)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="53" cy="9" r="3.5" fill="var(--color-teal)" />
      </svg>
      {withWordmark && (
        <span
          className="font-display text-ink"
          style={{ fontSize: size * 0.56, lineHeight: 1, letterSpacing: '-0.04em' }}
        >
          yv<span className="text-teal">.</span>
        </span>
      )}
    </Link>
  )
}
