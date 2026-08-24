import { useEffect, useRef } from 'react'
import type * as THREE from 'three'

/**
 * Faithful port of OriginKit's `gallery-tunnel` component — `variant-3` preset.
 *
 * Engine constants (TUNNEL_WIDTH 2, TUNNEL_HEIGHT 1.8, SEGMENT_DEPTH 1,
 * NUM_SEGMENTS 15, LINE_RADIUS 0.003, SCROLL_TO_Z 0.05, CAMERA_CHASE 0.1,
 * FOG_FAR = NUM_SEGMENTS * DEPTH * 0.95) and the populate() slab logic
 * (every other segment takes slabs; each slab then has a 50% chance to show;
 * shown slabs alternate color/image materials via stride counters) are
 * 1:1 with the published module. Only the "images" half is swapped for
 * Folio gradient canvases, per the user's no-text/plain-blocks direction.
 *
 * Strict variant-3 tweaks: fade:100 · grid:6 · boost:33 · speed:100 ·
 * tunnelSize:1 · lineOpacity:100 · lineColor:#E4E4E4 · background:#FFFFFF
 */

// ---- strict variant-3 tweak values ----
const CFG = {
  background: '#FFFFFF',
  lineColor: '#E4E4E4',
  lineOpacity: 100,
  grid: 6,
  speed: 100,
  boost: 33,
  fade: 100,
  tunnelSize: 1,
}

// OriginKit variant-3 palette (kept exactly; Folio-neutral enough on white)
// Folio application theme colors (from index.css @theme tokens)
const COLORS = [
  '#0f766e', // Deep Teal — accent
  '#115e59', // Teal press
  '#e6f2f0', // Soft Tint
  '#efebe3', // Warm Cream
  '#f7f5f2', // Canvas Paper
  '#78716c', // Muted Umber
]

// engine constants — identical to the published module
const TUNNEL_WIDTH = 2 * CFG.tunnelSize
const TUNNEL_HEIGHT = 1.8 * CFG.tunnelSize
const SEGMENT_DEPTH = 1
const NUM_SEGMENTS = 15
const LINE_RADIUS = 0.003
const SCROLL_TO_Z = 0.05
const CAMERA_CHASE = 0.1
const FOG_FAR = NUM_SEGMENTS * SEGMENT_DEPTH * 0.95

export default function GalleryTunnel({ className = '' }: { className?: string }) {
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
      scene.background = new THREE.Color(CFG.background)
      const fogNear = Math.min(FOG_FAR * (1 - Math.min(100, Math.max(0, CFG.fade)) / 100), FOG_FAR - 0.01)
      scene.fog = new THREE.Fog(new THREE.Color(CFG.background), fogNear, FOG_FAR)

      const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000)
      camera.position.set(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' })
      host.appendChild(renderer.domElement)

      const lineMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(CFG.lineColor),
        transparent: true,
        opacity: Math.min(100, Math.max(0, CFG.lineOpacity)) / 100,
      })

      // Folio gradient canvases stand in for the demo's image URLs
      function makeGradientMat(index: number) {
        const c = document.createElement('canvas')
        c.width = c.height = 128
        const ctx = c.getContext('2d')!
        const stops: [string, string][] = [
          ['#e6f2f0', '#0f766e'], // tint -> deep teal
          ['#d1e5e2', '#115e59'], // teal wash -> teal press
          ['#f7f5f2', '#efebe3'], // canvas -> cream
          ['#efebe3', '#78716c'], // cream -> umber
        ]
        const [a, b] = stops[index % stops.length]
        const g = ctx.createLinearGradient(0, 0, 128, 128)
        g.addColorStop(0, a)
        g.addColorStop(1, b)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, 128, 128)
        const tex = new THREE.CanvasTexture(c)
        tex.colorSpace = THREE.SRGBColorSpace
        return new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
      }

      const palette = COLORS
      const colorMats = palette.map((hex) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex), side: THREE.DoubleSide }))
      const imageMats = palette.map((_, i) => makeGradientMat(i))

      let imageIndex = 0
      let colorIndex = 0
      let populateIndex = 0
      let scrollPos = 0
      let raf = 0
      let pressed = false
      let alive = true

      const hw = TUNNEL_WIDTH / 2
      const hh = TUNNEL_HEIGHT / 2
      const cols = Math.max(1, Math.round(CFG.grid))
      const rows = Math.max(1, Math.round(CFG.grid))
      const colW = TUNNEL_WIDTH / cols
      const rowH = TUNNEL_HEIGHT / rows

      const geoFloor = new THREE.PlaneGeometry(colW, SEGMENT_DEPTH)
      const geoWall = new THREE.PlaneGeometry(SEGMENT_DEPTH, rowH)
      const geoTubeZ = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -SEGMENT_DEPTH)), 1, LINE_RADIUS, 8)
      const geoTubeX = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(TUNNEL_WIDTH, 0, 0)), 1, LINE_RADIUS, 8)
      const geoTubeY = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, TUNNEL_HEIGHT, 0)), 1, LINE_RADIUS, 8)

      const tube = (geo: THREE.BufferGeometry, x: number, y: number, z = 0) => {
        const m = new THREE.Mesh(geo, lineMaterial)
        m.position.set(x, y, z)
        return m
      }

      // SLOTS: every grid cell across floor/ceiling/both walls — exactly as the original
      const SLOTS: Array<{ geo: THREE.BufferGeometry; pos: THREE.Vector3; rot: THREE.Euler }> = []
      {
        const z = -SEGMENT_DEPTH / 2
        for (let i = 0; i < cols; i++) {
          const x = -hw + i * colW + colW / 2
          SLOTS.push({ geo: geoFloor, pos: new THREE.Vector3(x, -hh, z), rot: new THREE.Euler(-Math.PI / 2, 0, 0) })
          SLOTS.push({ geo: geoFloor, pos: new THREE.Vector3(x, hh, z), rot: new THREE.Euler(Math.PI / 2, 0, 0) })
        }
        for (let i = 0; i < rows; i++) {
          const y = -hh + i * rowH + rowH / 2
          SLOTS.push({ geo: geoWall, pos: new THREE.Vector3(-hw, y, z), rot: new THREE.Euler(0, Math.PI / 2, 0) })
          SLOTS.push({ geo: geoWall, pos: new THREE.Vector3(hw, y, z), rot: new THREE.Euler(0, -Math.PI / 2, 0) })
        }
      }

      // populate(): every OTHER segment may take slabs; each slab then shows
      // only 50% of the time; shown slabs alternate color/gradient via strides.
      function populate(group: THREE.Group) {
        const takesSlabs = populateIndex % 2 === 0
        populateIndex++
        const slabs = group.userData.slabs as THREE.Mesh[]
        for (const slab of slabs) {
          if (!takesSlabs || Math.random() > 0.5) {
            slab.visible = false
            continue
          }
          slab.visible = true
          if (Math.random() > 0.5) {
            slab.material = colorMats[(5 * colorIndex) % colorMats.length]
            colorIndex++
          } else {
            slab.material = imageMats[(3 * imageIndex) % imageMats.length]
            imageIndex++
          }
        }
      }

      function createSegment(z: number) {
        const group = new THREE.Group()
        group.position.z = z
        for (let i = 0; i <= cols; i++) {
          const x = -hw + i * colW
          group.add(tube(geoTubeZ, x, -hh))
          group.add(tube(geoTubeZ, x, hh))
        }
        for (let i = 1; i < rows; i++) {
          const y = -hh + i * rowH
          group.add(tube(geoTubeZ, -hw, y))
          group.add(tube(geoTubeZ, hw, y))
        }
        group.add(tube(geoTubeX, -hw, -hh))
        group.add(tube(geoTubeX, -hw, hh))
        group.add(tube(geoTubeY, -hw, -hh))
        group.add(tube(geoTubeY, hw, -hh))

        const slabs: THREE.Mesh[] = SLOTS.map((slot) => {
          const m = new THREE.Mesh(slot.geo, colorMats[0])
          m.position.copy(slot.pos)
          m.rotation.copy(slot.rot)
          m.visible = false
          group.add(m)
          return m
        })
        group.userData.slabs = slabs
        populate(group)
        return group
      }

      const segments: THREE.Group[] = []
      for (let i = 0; i < NUM_SEGMENTS; i++) {
        const g = createSegment(-i * SEGMENT_DEPTH)
        scene.add(g)
        segments.push(g)
      }

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

      host.addEventListener('pointerdown', () => { pressed = true })
      window.addEventListener('pointerup', () => { pressed = false })

      const cfgSpeed = Math.max(0, CFG.speed) / 100
      const cfgBoost = Math.max(0, CFG.boost) / 10

      const animate = () => {
        if (!alive) return
        raf = requestAnimationFrame(animate)
        if (!visible) return

        scrollPos += pressed && !reduced ? cfgBoost : cfgSpeed
        const want = -SCROLL_TO_Z * scrollPos
        camera.position.z += CAMERA_CHASE * (want - camera.position.z)

        const span = NUM_SEGMENTS * SEGMENT_DEPTH
        const z = camera.position.z
        for (const seg of segments) {
          if (seg.position.z > z + SEGMENT_DEPTH) {
            let min = 0
            for (const s of segments) min = Math.min(min, s.position.z)
            seg.position.z = min - SEGMENT_DEPTH
            populate(seg)
          } else if (seg.position.z < z - span - SEGMENT_DEPTH) {
            let max = -999999
            for (const s of segments) max = Math.max(max, s.position.z)
            seg.position.z = max + SEGMENT_DEPTH
            populate(seg)
          }
        }

        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(animate)

      teardown = () => {
        alive = false
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
  }, [])

  return <div ref={hostRef} aria-hidden="true" className={className} />
}
