import { useEffect } from 'react'
import LandingNav from '../components/landing/LandingNav'
import HeroTunnel from '../components/landing/HeroTunnel'
import ProofStrip from '../components/landing/ProofStrip'
import Features from '../components/landing/Features'
import Showcase from '../components/landing/Showcase'
import HowItWorks from '../components/landing/HowItWorks'
import Testimonials from '../components/landing/Testimonials'
import CtaBlock from '../components/landing/CtaBlock'
import LandingFooter from '../components/landing/LandingFooter'
import { initLenis, destroyLenis, ScrollTrigger } from '../lib/landing/motion'

export default function LandingPage() {
  useEffect(() => {
    initLenis()
    // images/fonts can shift layout — recalc pin distances once settled
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 600)
    return () => {
      window.clearTimeout(t)
      ScrollTrigger.getAll().forEach((st) => st.kill())
      destroyLenis()
    }
  }, [])

  return (
    <div id="top" className="landing bg-canvas text-ink antialiased">
      <LandingNav />
      <main>
        <HeroTunnel />
        <ProofStrip />
        <Features />
        <Showcase />
        <HowItWorks />
        <Testimonials />
        <CtaBlock />
      </main>
      <LandingFooter />
    </div>
  )
}
