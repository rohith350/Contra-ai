import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { ContraAISphereProps } from '../types/sphere'
import { SPHERE_CONFIG, STATE_CONFIGS } from './sphere-config'
import '../styles/ContraAISphere.css'

export function ContraAISphere({
  state = 'idle',
  className = '',
  size = 480,
  interactive = true,
  label,
}: ContraAISphereProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGLSupported] = useState(() => {
    try {
      const canvas = document.createElement('canvas')
      return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch {
      return false
    }
  })
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !webGLSupported) return

    // Motion sensitivity check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Dimensions
    const width = container.clientWidth || size
    const height = container.clientHeight || size

    // Scene & Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100)
    camera.position.z = 6.0

    // Renderer with device pixel ratio clamp
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, SPHERE_CONFIG.maxDpr))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // High-luminous radial sprite generator with a sharp brilliant white center
    const createGlowTexture = () => {
      const texCanvas = document.createElement('canvas')
      texCanvas.width = 64
      texCanvas.height = 64
      const ctx = texCanvas.getContext('2d')
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
        gradient.addColorStop(0.18, 'rgba(255, 255, 255, 0.95)')
        gradient.addColorStop(0.42, 'rgba(80, 240, 230, 0.75)')
        gradient.addColorStop(0.72, 'rgba(0, 160, 200, 0.25)')
        gradient.addColorStop(1, 'rgba(0, 40, 80, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 64, 64)
      }
      return new THREE.CanvasTexture(texCanvas)
    }

    const particleTexture = createGlowTexture()

    // 1. DENSE FIBONACCI SPHERE (5,200 particles)
    const count = SPHERE_CONFIG.particleCount
    const positions = new Float32Array(count * 3)
    const basePositions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const phases = new Float32Array(count)

    const colorWhite = new THREE.Color(STATE_CONFIGS.idle.primaryColor)
    const colorCyan = new THREE.Color(STATE_CONFIGS.idle.secondaryColor)

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
      const phi = i * 2.399963229728653 // Golden angle

      const x = Math.cos(phi) * radiusAtY
      const z = Math.sin(phi) * radiusAtY

      const r = SPHERE_CONFIG.baseRadius

      positions[i * 3] = x * r
      positions[i * 3 + 1] = y * r
      positions[i * 3 + 2] = z * r

      basePositions[i * 3] = x * r
      basePositions[i * 3 + 1] = y * r
      basePositions[i * 3 + 2] = z * r

      phases[i] = Math.random() * Math.PI * 2

      // Depth gradient coloring: crisp white at crests, cyan on edges
      const lerpFactor = (y + 1) * 0.5
      const pColor = colorWhite.clone().lerp(colorCyan, lerpFactor * 0.8)
      colors[i * 3] = pColor.r
      colors[i * 3 + 1] = pColor.g
      colors[i * 3 + 2] = pColor.b
    }

    const sphereGeometry = new THREE.BufferGeometry()
    sphereGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    sphereGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const sphereMaterial = new THREE.PointsMaterial({
      size: 0.082, // Higher density & visibility
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const spherePoints = new THREE.Points(sphereGeometry, sphereMaterial)
    scene.add(spherePoints)

    // 2. INNER BRILLIANT ENERGY CORE (950 particles)
    const innerCount = SPHERE_CONFIG.innerParticles
    const innerPositions = new Float32Array(innerCount * 3)
    const innerBasePositions = new Float32Array(innerCount * 3)
    const innerColors = new Float32Array(innerCount * 3)

    for (let i = 0; i < innerCount; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const r = Math.cbrt(Math.random()) * SPHERE_CONFIG.coreRadius

      const sinPhi = Math.sin(phi)
      const x = r * sinPhi * Math.cos(theta)
      const y = r * sinPhi * Math.sin(theta)
      const z = r * Math.cos(phi)

      innerPositions[i * 3] = x
      innerPositions[i * 3 + 1] = y
      innerPositions[i * 3 + 2] = z

      innerBasePositions[i * 3] = x
      innerBasePositions[i * 3 + 1] = y
      innerBasePositions[i * 3 + 2] = z

      // Intense luminous core: pure white center
      innerColors[i * 3] = 1.0
      innerColors[i * 3 + 1] = 1.0
      innerColors[i * 3 + 2] = 1.0
    }

    const innerGeometry = new THREE.BufferGeometry()
    innerGeometry.setAttribute('position', new THREE.BufferAttribute(innerPositions, 3))
    innerGeometry.setAttribute('color', new THREE.BufferAttribute(innerColors, 3))

    const innerMaterial = new THREE.PointsMaterial({
      size: 0.075,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const innerPoints = new THREE.Points(innerGeometry, innerMaterial)
    scene.add(innerPoints)

    // 3. SYNAPTIC NEURAL FILAMENTS (Arcs connecting neural nodes)
    const filamentGroup = new THREE.Group()
    const filamentCount = SPHERE_CONFIG.filamentCount
    const filamentLines: THREE.Line[] = []

    for (let f = 0; f < filamentCount; f++) {
      // Pick random points on surface
      const theta1 = Math.random() * Math.PI * 2
      const phi1 = Math.acos(Math.random() * 2 - 1)
      const r = SPHERE_CONFIG.baseRadius * 0.98

      const p1 = new THREE.Vector3(
        r * Math.sin(phi1) * Math.cos(theta1),
        r * Math.sin(phi1) * Math.sin(theta1),
        r * Math.cos(phi1)
      )

      // Near neighbor point
      const angleOffset = 0.35 + Math.random() * 0.55
      const theta2 = theta1 + angleOffset
      const phi2 = Math.max(0.1, Math.min(Math.PI - 0.1, phi1 + (Math.random() - 0.5) * 0.6))

      const p2 = new THREE.Vector3(
        r * Math.sin(phi2) * Math.cos(theta2),
        r * Math.sin(phi2) * Math.sin(theta2),
        r * Math.cos(phi2)
      )

      // Midpoint elevated slightly for an organic arc
      const mid = p1.clone().add(p2).multiplyScalar(0.5)
      mid.normalize().multiplyScalar(r * (1.02 + Math.random() * 0.08))

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2)
      const points = curve.getPoints(12)
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)

      const lineMat = new THREE.LineBasicMaterial({
        color: STATE_CONFIGS.idle.coreColor,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      })

      const line = new THREE.Line(lineGeo, lineMat)
      filamentGroup.add(line)
      filamentLines.push(line)
    }

    scene.add(filamentGroup)

    // 4. ELEGANT ORBITAL DATA RINGS (3 inclined rings with luminous nodes)
    const ringGroup = new THREE.Group()
    const rings: { points: THREE.Points; speed: number }[] = []

    const ringParams = [
      { radius: 2.7, count: 240, rotX: 0.75, rotY: 0.2, speed: 0.5 },
      { radius: 3.0, count: 280, rotX: -0.55, rotY: 0.45, speed: -0.4 },
      { radius: 3.3, count: 320, rotX: 0.35, rotY: -0.7, speed: 0.3 },
    ]

    ringParams.forEach((param) => {
      const ringPos = new Float32Array(param.count * 3)
      for (let i = 0; i < param.count; i++) {
        const angle = (i / param.count) * Math.PI * 2
        const r = param.radius + Math.sin(angle * 6) * 0.03
        ringPos[i * 3] = Math.cos(angle) * r
        ringPos[i * 3 + 1] = (Math.random() - 0.5) * 0.05
        ringPos[i * 3 + 2] = Math.sin(angle) * r
      }

      const ringGeo = new THREE.BufferGeometry()
      ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3))

      const ringMat = new THREE.PointsMaterial({
        size: 0.048,
        color: STATE_CONFIGS.idle.coreColor,
        map: particleTexture,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const ringMesh = new THREE.Points(ringGeo, ringMat)
      ringMesh.rotation.x = param.rotX
      ringMesh.rotation.y = param.rotY
      ringGroup.add(ringMesh)
      rings.push({ points: ringMesh, speed: param.speed })
    })

    scene.add(ringGroup)

    // 5. AMBIENT DUST
    const dustCount = SPHERE_CONFIG.dustCount
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const r = 2.4 + Math.random() * 1.6

      dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      dustPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      dustPos[i * 3 + 2] = r * Math.cos(phi)
    }

    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dustMat = new THREE.PointsMaterial({
      size: 0.038,
      color: 0x4ef2dc,
      map: particleTexture,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const dustPoints = new THREE.Points(dustGeo, dustMat)
    scene.add(dustPoints)

    // Interactive pointer parallax
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    const handlePointerMove = (e: MouseEvent) => {
      if (!interactive) return
      const rect = container.getBoundingClientRect()
      const relX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const relY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      pointer.targetX = relX * 0.4
      pointer.targetY = relY * 0.3
    }

    if (interactive) {
      window.addEventListener('mousemove', handlePointerMove)
    }

    // Dynamic state transition tracking
    const currentPrimary = new THREE.Color(STATE_CONFIGS.idle.primaryColor)
    const currentSecondary = new THREE.Color(STATE_CONFIGS.idle.secondaryColor)
    const currentCore = new THREE.Color(STATE_CONFIGS.idle.coreColor)

    const targetPrimary = new THREE.Color()
    const targetSecondary = new THREE.Color()
    const targetCore = new THREE.Color()

    let currentRotationSpeed = STATE_CONFIGS.idle.rotationSpeed
    let currentWaveSpeed = STATE_CONFIGS.idle.waveSpeed
    let currentPulseSpeed = STATE_CONFIGS.idle.pulseSpeed
    let currentPulseScale = STATE_CONFIGS.idle.pulseScale
    let currentRingSpeed = STATE_CONFIGS.idle.ringSpeed

    const clock = new THREE.Clock()
    let animationFrameId: number

    // Render loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const time = clock.getElapsedTime()

      const targetConfig = STATE_CONFIGS[stateRef.current] || STATE_CONFIGS.idle
      targetPrimary.setHex(targetConfig.primaryColor)
      targetSecondary.setHex(targetConfig.secondaryColor)
      targetCore.setHex(targetConfig.coreColor)

      // Smooth color LERP
      currentPrimary.lerp(targetPrimary, delta * 3.5)
      currentSecondary.lerp(targetSecondary, delta * 3.5)
      currentCore.lerp(targetCore, delta * 3.5)

      // Smooth speed LERP
      currentRotationSpeed += (targetConfig.rotationSpeed - currentRotationSpeed) * delta * 2.5
      currentWaveSpeed += (targetConfig.waveSpeed - currentWaveSpeed) * delta * 2.5
      currentPulseSpeed += (targetConfig.pulseSpeed - currentPulseSpeed) * delta * 2.5
      currentPulseScale += (targetConfig.pulseScale - currentPulseScale) * delta * 2.5
      currentRingSpeed += (targetConfig.ringSpeed - currentRingSpeed) * delta * 2.5

      // Parallax dampening
      pointer.x += (pointer.targetX - pointer.x) * 0.05
      pointer.y += (pointer.targetY - pointer.y) * 0.05

      const motionMult = prefersReducedMotion ? 0.15 : 1.0

      // Global rotation
      spherePoints.rotation.y += currentRotationSpeed * 0.65 * delta * motionMult
      spherePoints.rotation.x = pointer.y * 0.45
      spherePoints.rotation.z = pointer.x * 0.25

      filamentGroup.rotation.y = spherePoints.rotation.y
      filamentGroup.rotation.x = spherePoints.rotation.x
      filamentGroup.rotation.z = spherePoints.rotation.z

      innerPoints.rotation.y -= currentRotationSpeed * 0.9 * delta * motionMult
      innerPoints.rotation.x = -pointer.y * 0.35

      // Surface organic waves & breathing
      const posAttr = sphereGeometry.attributes.position as THREE.BufferAttribute
      const colAttr = sphereGeometry.attributes.color as THREE.BufferAttribute
      const posArr = posAttr.array as Float32Array
      const colArr = colAttr.array as Float32Array

      const breathingPulse = 1.0 + Math.sin(time * currentPulseSpeed) * currentPulseScale

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const bx = basePositions[i3]
        const by = basePositions[i3 + 1]
        const bz = basePositions[i3 + 2]

        const wave = Math.sin(time * currentWaveSpeed + phases[i] * 2.2) * 0.038 * motionMult
        const scale = breathingPulse + wave

        posArr[i3] = bx * scale
        posArr[i3 + 1] = by * scale
        posArr[i3 + 2] = bz * scale

        // Luminous gradient: white crests, cyan silhouettes
        const normY = (by / SPHERE_CONFIG.baseRadius + 1) * 0.5
        colArr[i3] = currentPrimary.r * (1 - normY * 0.4) + currentSecondary.r * (normY * 0.4)
        colArr[i3 + 1] = currentPrimary.g * (1 - normY * 0.4) + currentSecondary.g * (normY * 0.4)
        colArr[i3 + 2] = currentPrimary.b * (1 - normY * 0.4) + currentSecondary.b * (normY * 0.4)
      }

      posAttr.needsUpdate = true
      colAttr.needsUpdate = true

      // Inner core pulse
      const innerScale = 1.0 + Math.sin(time * currentPulseSpeed * 1.6) * (currentPulseScale * 1.8)
      innerPoints.scale.set(innerScale, innerScale, innerScale)

      const innerColAttr = innerGeometry.attributes.color as THREE.BufferAttribute
      const innerColArr = innerColAttr.array as Float32Array
      for (let i = 0; i < innerCount; i++) {
        const i3 = i * 3
        innerColArr[i3] = currentCore.r
        innerColArr[i3 + 1] = currentCore.g
        innerColArr[i3 + 2] = currentCore.b
      }
      innerColAttr.needsUpdate = true

      // Filaments color update
      filamentLines.forEach((line) => {
        const mat = line.material as THREE.LineBasicMaterial
        mat.color.copy(currentCore)
      })

      // Rings rotation
      rings.forEach((ring) => {
        ring.points.rotation.z += ring.speed * currentRingSpeed * delta * 0.5 * motionMult
        const mat = ring.points.material as THREE.PointsMaterial
        mat.color.copy(currentCore)
      })

      // Ambient dust float
      dustPoints.rotation.y += 0.04 * delta * motionMult
      dustPoints.rotation.x += 0.02 * delta * motionMult

      renderer.render(scene, camera)
    }

    animate()

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return
      const w = container.clientWidth || size
      const h = container.clientHeight || size
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, SPHERE_CONFIG.maxDpr))
    })

    resizeObserver.observe(container)

    // Cleanup and resource disposal
    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      if (interactive) {
        window.removeEventListener('mousemove', handlePointerMove)
      }

      // Dispose Geometries
      sphereGeometry.dispose()
      innerGeometry.dispose()
      dustGeo.dispose()
      rings.forEach((r) => r.points.geometry.dispose())
      filamentLines.forEach((l) => l.geometry.dispose())

      // Dispose Materials & Textures
      sphereMaterial.dispose()
      innerMaterial.dispose()
      dustMat.dispose()
      rings.forEach((r) => (r.points.material as THREE.Material).dispose())
      filamentLines.forEach((l) => (l.material as THREE.Material).dispose())
      particleTexture.dispose()

      // Dispose Renderer
      renderer.dispose()
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [interactive, size, webGLSupported])

  return (
    <div
      className={`contra-sphere-container ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Contra AI Neural Core in ${state} mode`}
    >
      {/* Soft, static white & cyan aura backing light */}
      <div className={`sphere-ambient-glow glow-${state}`} />

      {/* WebGL Canvas Viewport */}
      <div ref={containerRef} className="sphere-canvas-wrapper" />

      {/* Fallback for non-WebGL devices */}
      {!webGLSupported && (
        <div className="sphere-fallback-core">
          <div className="fallback-ring fallback-ring-1" />
          <div className="fallback-ring fallback-ring-2" />
          <div className="fallback-core" />
          <p className="fallback-text">Neural Core • Standby</p>
        </div>
      )}

      {/* HUD status pill */}
      {label && (
        <div className="sphere-hud-badge">
          <span className="hud-beacon" />
          <span className="hud-text">{label}</span>
        </div>
      )}
    </div>
  )
}
