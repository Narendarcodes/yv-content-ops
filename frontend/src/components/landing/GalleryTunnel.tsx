import { useEffect, useRef } from 'react'

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

function makeSlabTexture(THREE: Three, hue: 'teal' | 'amber' | 'umber' | 'cream') {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const stops: Record<string, [string, string, string]> = {
    teal: ['#e6f2f0', '#7fb8b0', '#0f766e'],
    amber: ['#f7f0dd', '#e3c98a', '#c09a4e'],
    umber: ['#efe9df', '#c2b49a', '#78716c'],
    cream: ['#ffffff', '#efebe3', '#d8d0bf'],
  }
  const [a, b, d] = stops[hue]
  const g = ctx.createLinearGradient(0, 0, 256, 256)
  g.addColorStop(0, a)
  g.addColorStop(0.55, b)
  g.addColorStop(1, d)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

interface TunnelOptions {
  background: string
  lineColor: string
}

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
      const slabMats = (['teal', 'amber', 'umber', 'cream'] as const).map((hue) => {
        const mat = new THREE.MeshBasicMaterial({ map: makeSlabTexture(THREE, hue), side: THREE.DoubleSide })
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
      function placeTile(group: THREE.Group, face: number, cell: number, material: THREE.Material | null) {
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
      function buildSegment(): THREE.Group {
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

        // sparse slabs — at most one per face, like the original
        const faces = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, 2)
        for (const face of faces) {
          const cell = rand(GRID)
          placeTile(group, face, cell, slabMats[rand(slabMats.length)])
        }
        return group
      }

      // ---------- segment chain ----------
      const segments: THREE.Group[] = []
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
            s.traverse((o) => (o as THREE.Mesh).geometry?.dispose?.())
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
