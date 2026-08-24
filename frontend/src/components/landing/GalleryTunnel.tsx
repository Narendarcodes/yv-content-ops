import { useEffect, useRef } from 'react'
import type * as THREE_NS from 'three'

/**
 * Faithful port of OriginKit's `gallery-tunnel` engine (from hero-03) to Folio.
 *
 * How the original works (reverse-engineered from its published module):
 * - Three.js corridor made of N identical "segments" chained along -Z.
 * - Each segment = grid wires on floor/ceiling/both walls + a few sparse
 *   image slabs applied to random grid cells.
 * - Camera drifts forward forever; when a segment passes behind the camera
 *   it teleports to the far end of the chain and re-randomizes → seamless
 *   infinite tunnel with zero popping.
 * - Fog fades the far end into the background; speed eases; hold-to-boost.
 *
 * Folio adaptations: gradient slab textures painted on canvases (no external
 * assets), warm-paper palette, DPR clamp, rAF paused off-screen/hidden so
 * scrolling never flickers.
 */

type Three = typeof import('three')

const SEGMENTS = 15
const SEG_LEN = 1 // length of one segment along Z
const HALF_W = 0.9 // corridor half-width  (X)
const HALF_H = 0.5 // corridor half-height (Y)
const GRID = 4 // cells per face
const SPEED = 0.055 // forward units/sec

/** Mini product-moment cards painted onto tunnel wall slabs (Folio flavor). */
const SLAB_CARDS = [
  { title: 'Brief locked', detail: 'Northwind × Folio', dot: '#0f766e' },
  { title: 'Review approved', detail: 'Spring campaign v4', dot: '#15803d' },
  { title: 'Scheduled', detail: '12 assets · next week', dot: '#b45309' },
  { title: '+3 revisions merged', detail: 'Q3 launch kit', dot: '#0f766e' },
  { title: 'Published', detail: 'Case study → blog', dot: '#2563eb' },
]

/**
 * Paints one wall-slab texture: a soft gradient ground + a mini product card
 * (title, detail, colored status dot) so the corridor reads as Folio moments
 * flying past instead of blank decoration.
 */
function makeSlabTexture(THREE: Three, index: number) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 320
  const ctx = c.getContext('2d')!

  // gradient grounds cycle through the warm palette
  const stops: [string, string, string][] = [
    ['#e6f2f0', '#7fb8b0', '#0f766e'],
    ['#f7f0dd', '#e3c98a', '#c09a4e'],
    ['#efe9df', '#c2b49a', '#78716c'],
    ['#ffffff', '#efebe3', '#d8d0bf'],
  ]
  const g = ctx.createLinearGradient(0, 0, 512, 320)
  g.addColorStop(0, stops[index % stops.length][0])
  g.addColorStop(0.55, stops[index % stops.length][1])
  g.addColorStop(1, stops[index % stops.length][2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 320)

  // the mini product card
  const card = SLAB_CARDS[index % SLAB_CARDS.length]
  const pad = 44
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  const rx = pad
  const ry = 96
  const rw = 512 - pad * 2
  const rh = 150
  const r = 22
  ctx.beginPath()
  ctx.roundRect(rx, ry, rw, rh, r)
  ctx.shadowColor = 'rgba(28,25,23,0.25)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 10
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // status dot + title + detail
  ctx.fillStyle = card.dot
  ctx.beginPath()
  ctx.arc(rx + 40, ry + 52, 11, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1c1917'
  ctx.font = '600 34px Figtree, sans-serif'
  ctx.fillText(card.title, rx + 66, ry + 64)
  ctx.fillStyle = 'rgba(28,25,23,0.55)'
  ctx.font = '400 26px Figtree, sans-serif'
  ctx.fillText(card.detail, rx + 66, ry + 112)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

type Mesh = THREE_NS.Mesh
type Group = THREE_NS.Group

type TunnelOptions = { background: string; lineColor: string }

export default function GalleryTunnel({ className = '', background = '#f7f5f2', lineColor = '#c6bfae' }: { className?: string } & Partial<TunnelOptions>) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let killed = false
    let teardown: (() => void) | null = null

    ;(async () => {
      const THREE = await import('three')
      if (killed || !hostRef.current) return

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(background)
      scene.fog = new THREE.Fog(new THREE.Color(background), 4.2, 8.8)

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' })
      host.appendChild(renderer.domElement)

      // ---------- shared materials & geometry ----------
      const lineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(lineColor), transparent: true, opacity: 0.55 })
      const slabMats = SLAB_CARDS.map((_, i) => {
        const mat = new THREE.MeshBasicMaterial({ map: makeSlabTexture(THREE, i), side: THREE.DoubleSide })
        return mat
      })

      const faceW = (HALF_W * 2) / GRID
      const faceH = (HALF_H * 2) / GRID

      const wireX = new THREE.TubeGeometry(
        new THREE.LineCurve3(new THREE.Vector3(0, 0, -SEG_LEN), new THREE.Vector3(0, 0, SEG_LEN)), 1, 0.0035, 6,
      )
      const tileFloorCeil = new THREE.PlaneGeometry(faceW * 0.96, SEG_LEN) // XZ tiles
      const tileWall = new THREE.PlaneGeometry(SEG_LEN, faceH * 0.96) // ZY tiles

      /** One grid cell on one of the four faces. face: 0 floor · 1 ceiling · 2 left · 3 right */
      function placeTile(group: THREE_NS.Group, face: number, cell: number, material: THREE_NS.Material | null) {
        const mesh = new THREE.Mesh(face <= 1 ? tileFloorCeil : tileWall, material ?? lineMat)
        if (face === 0) {
          mesh.position.set(-HALF_W + (cell + 0.5) * faceW, -HALF_H, -SEG_LEN / 2)
          mesh.rotation.x = -Math.PI / 2
        } else if (face === 1) {
          mesh.position.set(-HALF_W + (cell + 0.5) * faceW, HALF_H, -SEG_LEN / 2)
          mesh.rotation.x = Math.PI / 2
        } else if (face === 2) {
          mesh.position.set(-HALF_W, -HALF_H + (cell + 0.5) * faceH, -SEG_LEN / 2)
          mesh.rotation.y = Math.PI / 2
        } else {
          mesh.position.set(HALF_W, -HALF_H + (cell + 0.5) * faceH, -SEG_LEN / 2)
          mesh.rotation.y = -Math.PI / 2
        }
        group.add(mesh)
        return mesh
      }

      const rand = (n: number) => Math.floor(Math.random() * n)

      /** Build one corridor segment: full grid wires + ~2 random gradient slabs. */
      function buildSegment(): THREE_NS.Group {
        const group = new THREE.Group()

        // transverse wires across floor & ceiling
        for (let i = 0; i <= GRID; i++) {
          const x = -HALF_W + i * faceW
          for (const y of [-HALF_H, HALF_H]) {
            const m = new THREE.Mesh(wireX, lineMat)
            m.position.set(x, y, -SEG_LEN / 2)
            group.add(m)
          }
        }
        // longitudinal wires along both walls
        for (let i = 1; i < GRID; i++) {
          const y = -HALF_H + i * faceH
          for (const x of [-HALF_W, HALF_W]) {
            const m = new THREE.Mesh(wireX, lineMat)
            m.position.set(x, y, -SEG_LEN / 2)
            group.add(m)
          }
        }

        // sparse slabs — up to two per segment (walls preferred so cards face the camera)
        const faces = [2, 3, 0, 1].sort(() => Math.random() - 0.5).slice(0, 2)
        for (const face of faces) {
          const cell = rand(GRID)
          placeTile(group, face, cell, slabMats[rand(slabMats.length)])
        }
        return group
      }

      // ---------- segment chain ----------
      const segments: Group[] = []
      for (let i = 0; i < SEGMENTS; i++) {
        const s = buildSegment()
        s.position.z = -i * SEG_LEN
        scene.add(s)
        segments.push(s)
      }

      const CHAIN_LEN = SEGMENTS * SEG_LEN

      // ---------- sizing ----------
      const resize = () => {
        const w = Math.max(1, host.clientWidth)
        const h = Math.max(1, host.clientHeight)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h, false)
      }
      const ro = new ResizeObserver(resize)
      ro.observe(host)
      resize()

      // ---------- animation ----------
      let visible = true
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
      io.observe(host)
      const onVis = () => { if (document.hidden) visible = false }
      document.addEventListener('visibilitychange', onVis)

      let distance = 0
      let camZ = 0
      let last = 0
      let raf = 0
      const tick = (t: number) => {
        raf = requestAnimationFrame(tick)
        const dt = last ? Math.min((t - last) / 1000, 1 / 30) : 1 / 30
        last = t
        if (!visible) return // paused off-screen → no scroll flicker

        if (!reduced) distance += SPEED * dt
        camZ += (distance - camZ) * 0.12 // eased forward drift
        camera.position.z = camZ

        for (const s of segments) {
          if (s.position.z > camZ + SEG_LEN) {
            s.position.z -= CHAIN_LEN
            // re-randomize: rebuild this segment in place
            const z = s.position.z
            scene.remove(s)
            s.traverse((o: any) => (o as Mesh).geometry?.dispose?.())
            const fresh = buildSegment()
            fresh.position.z = z
            segments[segments.indexOf(s)] = fresh
            scene.add(fresh)
          }
        }

        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(tick)

      teardown = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        io.disconnect()
        document.removeEventListener('visibilitychange', onVis)
        renderer.dispose()
        renderer.domElement.remove()
      }
    })()

    return () => {
      killed = true
      teardown?.()
    }
  }, [background, lineColor])

  return <div ref={hostRef} aria-hidden="true" className={className} />
}
