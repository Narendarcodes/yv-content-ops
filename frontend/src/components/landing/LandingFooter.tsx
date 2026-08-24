const PRODUCT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Stories', href: '#stories' },
]

const APP_LINKS = [
  { label: 'Open the app', href: '/login' },
  { label: 'Create account', href: '/register' },
]

export default function LandingFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* brand */}
          <div>
            <p className="font-display text-2xl text-ink">Folio</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-umber">
              The project memory platform for content teams — briefs, reviews,
              production and publishing in one calm, connected workspace.
            </p>
          </div>

          {/* product */}
          <nav aria-label="Product">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-umber">Product</p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-ink/80 transition-colors duration-200 hover:text-teal">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* app */}
          <nav aria-label="Get started">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-umber">Get started</p>
            <ul className="mt-4 space-y-2.5">
              {APP_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-ink/80 transition-colors duration-200 hover:text-teal">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-xs text-umber/80">
            © {new Date().getFullYear()} Folio — content operations &amp; project memory.
          </p>
          <p className="text-xs text-umber/60">
            Built for teams who refuse to forget.
          </p>
        </div>
      </div>
    </footer>
  )
}
