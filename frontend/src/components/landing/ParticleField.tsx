import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ParticleFieldProps {
  /** 0..1 — how many particles / how bright. */
  density?: number
  opacity?: number
  className?: string
}

/**
 * Ambient WebGL dot-matrix field — the pattern every inspiration source agrees on:
 * fixed full-bleed canvas at z-0 behind content, sparse dots, slow orbital drift +
 * breathing pulse (custom shader), pointer-parallax drift, DPR clamp, graceful
 * CSS-gradient fallback when WebGL is unavailable.
 */
export default function ParticleField({ density = 0.5, opacity = 0.25, className = '' }: ParticleFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' })
    } catch {
      // Graceful fallback: paint the art direction straight onto the host.
      host.style.background =
        'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(15,118,110,0.10), transparent 70%)'
      return
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    renderer.setPixelRatio(dpr)
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, host.clientWidth / host.clientHeight, 0.1, 100)
    camera.position.z = 14

    const COUNT = Math.floor(900 + density * 2200)
    const positions = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const r = 4 + Math.random() * 11
      const theta = Math.random() * Math.PI * 2
      positions[i * 3] = Math.cos(theta) * r * 1.5
      positions[i * 3 + 1] = Math.sin(theta) * r * 0.75
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
      seeds[i] = Math.random() * Math.PI * 2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: dpr },
      uOpacity: { value: opacity },
    }

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform vec2 uPointer;
        attribute float aSeed;
        varying float vTwinkle;
        void main() {
          vec3 p = position;
          float t = uTime * 0.06 + aSeed;
          // slow orbital drift around each particle's band
          p.x += sin(t) * 0.9;
          p.y += cos(t * 0.8) * 0.55;
          // pointer parallax, depth-weighted
          p.x += uPointer.x * (0.6 + position.z * 0.12);
          p.y += uPointer.y * (0.4 + position.z * 0.08);
          vTwinkle = 0.65 + 0.35 * sin(uTime * 0.7 + aSeed * 3.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.4 + aSeed / 6.2831 * 1.8) * uPixelRatio * (10.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform float uTime;
        varying float vTwinkle;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float disc = smoothstep(0.5, 0.12, d);
          // deep teal -> warm amber blend per twinkle phase
          vec3 teal = vec3(0.059, 0.463, 0.431);
          vec3 amber = vec3(0.78, 0.62, 0.38);
          vec3 col = mix(teal, amber, 0.25 + 0.25 * sin(uTime * 0.3));
          float breathe = 0.85 + 0.15 * sin(uTime * 0.45);
          gl_FragColor = vec4(col, disc * uOpacity * vTwinkle * breathe);
        }
      `,
    })

    const points = new THREE.Points(geo, mat)
    scene.add(points)

    const pointerTarget = new THREE.Vector2(0, 0)
    const onPointer = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      pointerTarget.set(
        ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        -((e.clientY - rect.top) / rect.height - 0.5) * 2,
      )
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(host)

    const clock = new THREE.Clock()
    let rafId = 0
    const tick = () => {
      rafId = requestAnimationFrame(tick)
      if (!visible || document.hidden) return
      const t = reduced ? 0 : clock.getElapsedTime()
      uniforms.uTime.value = t
      uniforms.uPointer.value.lerp(pointerTarget, 0.04)
      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      if (!host.clientWidth) return
      renderer.setSize(host.clientWidth, host.clientHeight)
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      io.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('resize', onResize)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [density, opacity])

  return <div ref={hostRef} aria-hidden="true" className={className} />
}
