export default function LandingFooter() {
  return (
    <footer className="border-t border-line bg-canvas py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <p className="font-display text-xl text-ink">Folio</p>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-umber">
          <a href="#features" className="transition-colors hover:text-ink">Features</a>
          <a href="#how" className="transition-colors hover:text-ink">How it works</a>
          <a href="#stories" className="transition-colors hover:text-ink">Stories</a>
        </nav>
        <p className="text-xs text-umber/70">© {new Date().getFullYear()} Folio — content operations & project memory.</p>
      </div>
    </footer>
  )
}
