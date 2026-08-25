# yv. Marketing Landing Page — Implementation Plan

**Status:** FINAL — fuses all 13 sources: 7 DESIGN.md docs, 6 OriginKit sections (hero-01/03/06/15/20 + cta-02 gallery posters), yv. app design system, product story.
**Sources:** 7 DESIGN.md inspiration docs (`inspiration-docs-synthesis.md`), OriginKit sections hero-01/03/06/15/20 + cta-02 (gallery posters), yv. app design system (`frontend/src/index.css`), product story (README + PRD).

---

## 0. Product & Goal

**Product:** yv. — Content Operations & Project Memory Platform (Aaryajanani). For content-ops teams/agencies: briefs → projects → reviews/locks → kanban production → chat → approvals → schedule/publish, plus contracts & invoices. App frontend exists (React 18 + Vite + Tailwind v4, routes behind auth).

**Goal:** A single premium animated marketing landing page that makes yv. feel *authored, tactile and alive* — paper-craft editorial identity carried by WebGL/GSAP motion engineering.

**Route:** public `/landing` (does not collide with authed `"/"` dashboard); linked from Login/Register pages ("Learn more").

---

## 1. Design Direction (from all sources)

### Verdict
**Cluster A — Warm Paper Editorial** (Archive, Craft, Imprint docs; OriginKit hero-03's gallery-corridor editorial mood) **powered by Cluster C's motion engineering** (Nimbus's GSAP ScrollTrigger architecture).

### Palette — extend existing yv. tokens only
| Role | Value | Source |
|---|---|---|
| Canvas | `#f7f5f2` | existing `--color-canvas` |
| Surface ladder | `#ffffff` → `#efebe3` → translucent cream | Archive's 3-elevation card ladder |
| Ink | `#1c1917` | existing `--color-ink` |
| Muted | `#78716c` | existing `--color-umber` |
| Accent (sole) | `#0f766e` deep teal (+ tint `#e6f2f0`) | existing |
| Shadows | always ink-tinted `rgba(28,25,23,…)` — never pure black | Archive/Craft warm-shadow rule |

Forbidden: blue/violet/orange gradients (Cluster C/D palette collisions), multi-accent shells.

### Typography — extreme scale contrast
- **Display:** Instrument Serif (Google Fonts) — Imprint Press's 120px editorial move; used for hero + section headlines, weight 400, tight leading.
- **Body/UI:** existing Figtree (+ Outfit retained for UI chrome inside mockups).
- Scale rhythm: display clamp(56px→120px), section heads clamp(36px→64px), body 16px/1.6, labels 12–14px semibold tracked.

### Material rules (one surface recipe, applied consistently)
- Light-mode elevated cards: white, 20–22px radius, warm shadow `0 24px 48px -16px rgba(28,25,23,.14)`.
- Signature **gradient-border hairline shell**: outer wrapper with 1px teal-tinted gradient border, inset inner surface (Craft/Archive recurring technique) on feature/pricing cards.
- **Diagonal hatch overlay** at ~2.5% ink opacity on cream bands (CoinCompass technique, re-tinted) for print materiality.

---

## 1b. OriginKit image findings — fused adjustments

The five analyzed section images independently confirm and refine the direction:
- **Confirmed:** warm off-white canvas (`#F4F3F0` family ≈ our existing `#f7f5f2`), near-black ink, editorial display serif + grotesque body, dual-CTA pill pattern, staggered fade-up entrances, mouse parallax.
- **Adopted additions:**
  1. **Hand-drawn signature moment** (cta-02 / hero-01): an SVG stroke-drawn underline swoosh beneath the hero headline that draws itself ~0.8s after the headline lands (GSAP DrawSVG-style stroke-dashoffset tween). Repeated small as an annotation arrow near the primary CTA.
  2. **Human layer** (cta-02 / hero-15): floating avatar cards orbiting the hero edges with staggered bob loops + multi-depth pointer parallax — doubles as social proof for a team product.
  3. **Odometer count-ups** (cta-02) on the proof-strip stats via ScrollTrigger.
  4. **Micro-interactions everywhere** (hero-15/20): chevron nudge on button hover, press-scale 0.97, cursor-spotlight dot grid in the features band.
  5. **Film-grain overlay** (hero-06/20/cta-02) at very low opacity over the whole page — merged with the diagonal-hatch idea; grain wins (closer to the paper identity).
- **Rejected:** Creatora's red-orange `#FF4A1F` accent (collides with yv.'s teal identity — teal stays the sole accent), ArchiFlow's zero-color austerity (too cold alone).

## 2. Page Architecture (9 blocks)

1. **Nav** — floating pill, backdrop-blur, logo left, links center, "Open the app" pill CTA right. Shrinks on scroll (ScrollTrigger).
2. **Hero** *(OriginKit hero-03 mood + Aura/Nimbus canvas pattern)* — full-viewport; huge Instrument Serif headline over a fixed z-0 **Three.js particle field**: sparse amber→teal-tinted dots, slow orbital drift + breathing pulse (shader-based), pointer-parallax, restrained scroll-linked amplitude. Left-biased cream scrim (Imprint recipe) keeps type legible. Sub-copy, dual CTAs (solid ink pill + outline), small handwritten-style annotation near primary CTA (hero-01's playful cue). Staggered text-rise entrance.
3. **Proof strip** — quiet marquee of team/agency names + stat chips ("reviews locked", "assets shipped"). Low contrast.
4. **Features grid** *(Archive mosaic)* — 6 cards in 3-col grid on cream band: Briefs, Project memory, Review lock & summarize, Kanban production, Approvals, Schedule & publish. Gradient-border shell on the highlighted card. Icons: lucide linear set only.
5. **Product showcase** — framed dashboard mockup (built from real yv. UI primitives, not screenshot) tilted in perspective; ScrollTrigger scrub rotates it to flat while feature callouts pin/step. This is the hero-03 "depth corridor" homage translated to product space.
6. **How it works** — horizontal-scroll pinned section (Lenis+ScrollTrigger): Brief → Produce → Review → Ship, each step a large numeral in Instrument Serif + short copy.
7. **Testimonials** *(Craft's white-on-warm cards)* — 3 cards, warm shadows, terracotta-free: quote + name + role. Split-text reveal per card.
8. **CTA block** *(cta-02)* — full-bleed espresso `#1c1917` band (the one dark moment): huge serif headline, teal accent-glow button (CoinCompass glow-shadow recipe re-tinted), particle field re-used at higher density/dimmer.
9. **Footer** — minimal: wordmark, 3 link columns, copyright.

---

## 3. Motion System

**Stack:** `lenis` (smooth scroll, raf loop) + `gsap/ScrollTrigger` + raw WebGL shader field via `three`.

- Duration ladder (Craft): micro 150–200ms · transitions 300ms · section moments 500–640ms · easing `cubic-bezier(0.22,1,0.36,1)`; GSAP equivalents `power3.out/expo.out`.
- Reveals: `[data-reveal]` batch — y 24→0, opacity, slight rotateX; `[data-split]` paragraphs split into lines/words.
- Reduced motion: honor `prefers-reduced-motion` — kill Lenis smoothing, skip entrance staggers, static canvas frame.
- WebGL hygiene: DPR clamp ≤ 1.75, `powerPreference: 'low-power'`, pause when tab hidden, IntersectionObserver to stop offscreen canvases, CSS-gradient fallback painted on canvas when context creation fails.

## 4. File Plan

```
frontend/src/
├─ pages/LandingPage.tsx            // composition only
├─ components/landing/
│   ├─ LandingNav.tsx  Hero.tsx  ProofStrip.tsx  Features.tsx
│   ├─ Showcase.tsx   HowItWorks.tsx  Testimonials.tsx  CtaBlock.tsx  Footer.tsx
│   ├─ ParticleField.tsx             // three.js shader dots (reusable props: density, tint, opacity)
│   └─ Reveal.tsx                    // data-reveal/data-split helpers + useGsapContext hook
└─ lib/landing/motion.ts            // lenis singleton, ScrollTrigger registration, easings
```
Route added in `App.tsx`; fonts loaded in `index.html`; new tokens (`--font-display`, hatch util, glow shadow utilities) appended to `index.css` `@theme`.

## 5. Verification
1. `npm run build` passes (tsc + vite).
2. Dev server renders `/landing` without console errors; canvas falls back cleanly when WebGL disabled.
3. Visual pass at desktop + mobile widths (preview pane screenshots).
4. Reduced-motion mode spot check.
