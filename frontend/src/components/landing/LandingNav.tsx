import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Stories', href: '#stories' },
]

export default function LandingNav() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const compact = window.scrollY > 40
      el.classList.toggle('is-compact', compact)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header ref={ref} className="landing-nav fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 rounded-full border border-line bg-surface/80 py-2 pl-4 pr-2 shadow-card backdrop-blur-md transition-all duration-300 sm:pl-6">
        <a href="#top" className="font-display text-xl text-ink">
          Folio
        </a>
        <div className="hidden items-center gap-7 sm:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-umber transition-colors duration-200 hover:text-ink">
              {l.label}
            </a>
          ))}
        </div>
        <Link
          to="/login"
          className="shrink-0 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-canvas transition-transform duration-200 hover:-translate-y-px active:scale-[0.97] sm:px-5 sm:text-sm"
        >
          Open the app
        </Link>
      </nav>
    </header>
  )
}
