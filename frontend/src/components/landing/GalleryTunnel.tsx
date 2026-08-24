import { useEffect, useRef } from 'react'
import type * as THREE from 'three' // types only; runtime import is dynamic below

/**
 * Port of OriginKit's `gallery-tunnel` engine (hero-03) to Folio.
 *
 * - Three.js corridor of N chained segments along -Z: grid wires on
 *   floor/ceiling/walls + sparse plain gradient slabs.
 * - Camera drifts forward FOREVER at constant calm speed; segments passing
 *   behind the camera teleport to the far end and re-randomize their slabs
 *   (shared geometry is NEVER disposed → no vanishing over time).
 * - Minimal product words ("Briefs", "Reviews"…) float in the corridor gaps
 *   on transparent billboards you fly past.
 * - Fog fades the far end; rAF paused off-screen/hidden (no scroll flicker).
 */

type Three = typeof import('three')

// ---- OriginKit control-panel configuration (mapped to our engine) ----
// Grid Opacity: 50%   -> line material opacity 0.50
// Grid Count:  4      -> GRID (cells per face)
// Tunnel Size: 1      -> corridor scale multiplier (1 = default footprint)
// Speed: 100          -> base forward speed
// Click Boost: 100    -> hold-pointer accelerate multiplier
// Middle Fade: 100%   -> fog strength at the far end
const LINE_OPACITY = 0.5
const GRID = 4
const TUNNEL_SIZE = 1
const BASE_SPEED = 0.05 // units/sec at Speed=100
const CLICK_BOOST = 4.5 // hold-to-accelerate multiplier at Boost=100
const MIDDLE_FADE = 100 // % - drives fog near/far

const SEGMENTS = Math.max(8, Math.round(15 * TUNNEL_SIZE))
const SEG_LEN = 1
const HALF_W = 0.9 * TUNNEL_SIZE
const HALF_H = 0.5 * TUNNEL_SIZE

const SLAB_STOPS: [string, string, string][] = [
  ['#e6f2f0', '#7fb8b0', '#0f766e'],
  ['#f7f0dd', '#e3c98a', '#c09a4e'],
  ['#efe9df', '#c2b49a', '#78716c'],
  ['#ffffff', '#efebe3', '#d8d0bf'],
]

/** Plain gradient slab texture — no text. */
function makeSlabTexture(T3: Three, index: number) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const [a, b, d] = SLAB_STOPS[index % SLAB_STOPS.length]
  const g = ctx.createLinearGradient(0, 0, 256, 256)
  g.addColorStop(0, a)
  g.addColorStop(0.55, b)
  g.addColorStop(1, d)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const tex = new T3.CanvasTexture(c)
  tex.colorSpace = T3.SRGBColorSpace
  return tex
}


export default function GalleryTunnel({
  className = '',
  background = '#f7f5f2',
  lineColor = '#c6bfae',
}: {
  className?: string
  background?: string
  lineColor?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let killed = false
    let teardown: (() => void) | null = null

    ;(async () => {
      const T3 = await import('three')
      if (killed || !hostRef.current) return

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const scene = new T3.Scene()
      scene.background = new T3.Color(background)
      const fade = MIDDLE_FADE / 100
      const FOG_FAR = 6 + (13 - 6) * fade // higher fade -> deeper visibility falloff
      scene.fog = new T3.Fog(new T3.Color(background), FOG_FAR * 0.48, FOG_FAR)

      const camera = new T3.PerspectiveCamera(45, 1, 0.1, 100)

      const renderer = new T3.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' })
      host.appendChild(renderer.domElement)

      // ---------- shared materials & geometry (created ONCE, never disposed) ----------
      const lineMat = new T3.MeshBasicMaterial({ color: new T3.Color(lineColor), transparent: true, opacity: LINE_OPACITY })
      const slabMats = SLAB_STOPS.map((_, i) => new T3.MeshBasicMaterial({ map: makeSlabTexture(T3, i), side: T3.DoubleSide }))

      const faceW = (HALF_W * 2) / GRID
      const faceH = (HALF_H * 2) / GRID

      const wireX = new T3.TubeGeometry(
        new T3.LineCurve3(new T3.Vector3(0, 0, -SEG_LEN / 2), new T3.Vector3(0, 0, SEG_LEN / 2)), 1, 0.0035, 6,
      )
      const tileFloorCeil = new T3.PlaneGeometry(faceW * 0.96, SEG_LEN)
      const tileWall = new T3.PlaneGeometry(SEG_LEN, faceH * 0.96)

      /** One grid cell on one face: 0 floor · 1 ceiling · 2 left · 3 right */
      function placeTile(group: THREE.Group, face: number, cell: number, material: THREE.Material | null) {
        const mesh = new T3.Mesh(face <= 1 ? tileFloorCeil : tileWall, material ?? lineMat)
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

      interface Segment extends THREE.Group {
        userData: { slabs: THREE.Mesh[] }
      }

      /** Build one segment: grid wires + sparse plain-gradient slabs. */
      function buildSegment(): Segment {
        const group = new T3.Group() as unknown as Segment

        // transverse wires across floor & ceiling
        for (let i = 0; i <= GRID; i++) {
          const x = -HALF_W + i * faceW
          for (const y of [-HALF_H, HALF_H]) {
            const m = new T3.Mesh(wireX, lineMat)
            m.position.set(x, y, -SEG_LEN / 2)
            group.add(m)
          }
        }
        // longitudinal wires along both walls
        for (let i = 1; i < GRID; i++) {
          const y = -HALF_H + i * faceH
          for (const x of [-HALF_W, HALF_W]) {
            const m = new T3.Mesh(wireX, lineMat)
            m.position.set(x, y, -SEG_LEN / 2)
            group.add(m)
          }
        }

        // sparse PLAIN gradient slabs (no text)
        const slabs: THREE.Mesh[] = []
        const faces = [2, 3, 0, 1].sort(() => Math.random() - 0.5).slice(0, 2)
        for (const face of faces) {
          slabs.push(placeTile(group, face, rand(GRID), slabMats[rand(slabMats.length)]))
        }

        group.userData.slabs = slabs
        return group
      }

      /** Re-randomize an existing segment's slab colors (no geometry churn). */
      function reshuffle(seg: Segment) {
        for (const slab of seg.userData.slabs) {
          slab.material = slabMats[rand(slabMats.length)]
        }
      }

      // ---------- segment chain ----------
      const segments: Segment[] = []
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

      // Click Boost: hold the pointer down on the hero to accelerate.
      let pressed = false
      host.addEventListener('pointerdown', () => { pressed = true })
      window.addEventListener('pointerup', () => { pressed = false })

      let camZ = 0
      let last = 0
      let raf = 0
      const tick = (t: number) => {
        raf = requestAnimationFrame(tick)
        const dt = last ? Math.min((t - last) / 1000, 1 / 30) : 1 / 30
        last = t
        if (!visible) return // paused off-screen → no scroll flicker

        const speed = pressed ? BASE_SPEED * CLICK_BOOST : BASE_SPEED
        if (!reduced) camZ += speed * dt
        camera.position.z = camZ

        // teleport far-passed segments to the front; re-skin, never rebuild
        for (let i = 0; i < segments.length; i++) {
          const s = segments[i]
          if (s.position.z > camZ + SEG_LEN) {
            s.position.z -= CHAIN_LEN
            reshuffle(s)
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
