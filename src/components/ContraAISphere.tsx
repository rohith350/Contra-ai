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
  isListening = false,
  isSpeaking = false,
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
  const isListeningRef = useRef(isListening)
  const isSpeakingRef = useRef(isSpeaking)

  // Real Web Audio analyzer for microphone reactivity
  const audioDataRef = useRef<{
    audioContext: AudioContext | null
    analyser: AnalyserNode | null
    dataArray: Uint8Array<ArrayBuffer> | null
    stream: MediaStream | null
    smoothedVolume: number
    bassVolume: number
    trebleVolume: number
    readyTime: number
  }>({
    audioContext: null,
    analyser: null,
    dataArray: null,
    stream: null,
    smoothedVolume: 0,
    bassVolume: 0,
    trebleVolume: 0,
    readyTime: 0,
  })

  // Click / tap ripples on the particle core
  const ripplesRef = useRef<Array<{ x: number; y: number; z: number; startTime: number; intensity: number }>>([])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    isListeningRef.current = isListening
    isSpeakingRef.current = isSpeaking

    // Handle real microphone connection when isListening transitions to true
    if (isListening && !audioDataRef.current.stream) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: false })
          .then((stream) => {
            // Verify still listening before initializing audio context
            if (!isListeningRef.current) {
              stream.getTracks().forEach((track) => track.stop())
              return
            }

            try {
              const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
              const ctx = new AudioContextClass()
              const analyser = ctx.createAnalyser()
              analyser.fftSize = 64
              analyser.smoothingTimeConstant = 0.85
              const source = ctx.createMediaStreamSource(stream)
              source.connect(analyser)

              const dataArray = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))

              audioDataRef.current = {
                audioContext: ctx,
                analyser,
                dataArray,
                stream,
                smoothedVolume: 0,
                bassVolume: 0,
                trebleVolume: 0,
                readyTime: performance.now() + 350, // Ignore startup clicks/pops for first 350ms
              }
            } catch {
              // Gracefully fallback if Web Audio is blocked
            }
          })
          .catch(() => {
            // Permission denied or microphone unavailable - fallback cleanly
          })
      }
    } else if (!isListening && audioDataRef.current.stream) {
      // Release microphone tracks and close audio context cleanly
      audioDataRef.current.stream.getTracks().forEach((track) => track.stop())
      if (audioDataRef.current.audioContext && audioDataRef.current.audioContext.state !== 'closed') {
        audioDataRef.current.audioContext.close().catch(() => {})
      }
      audioDataRef.current = {
        audioContext: null,
        analyser: null,
        dataArray: null,
        stream: null,
        smoothedVolume: 0,
        bassVolume: 0,
        trebleVolume: 0,
        readyTime: 0,
      }
    }
  }, [isListening, isSpeaking])

  // Component unmount cleanup for audio
  useEffect(() => {
    return () => {
      if (audioDataRef.current.stream) {
        audioDataRef.current.stream.getTracks().forEach((t) => t.stop())
      }
      if (audioDataRef.current.audioContext && audioDataRef.current.audioContext.state !== 'closed') {
        audioDataRef.current.audioContext.close().catch(() => {})
      }
    }
  }, [])

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

    // Renderer with device pixel ratio clamp and transparent background
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, SPHERE_CONFIG.maxDpr))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // High-luminous radial sprite generator with a sharp brilliant cyan-white center
    const createGlowTexture = () => {
      const texCanvas = document.createElement('canvas')
      texCanvas.width = 64
      texCanvas.height = 64
      const ctx = texCanvas.getContext('2d')
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
        gradient.addColorStop(0.18, 'rgba(201, 255, 252, 0.95)') // #C9FFFC bright highlight
        gradient.addColorStop(0.42, 'rgba(66, 245, 233, 0.65)')  // #42F5E9 electric cyan
        gradient.addColorStop(0.72, 'rgba(53, 217, 208, 0.22)')  // #35D9D0 turquoise
        gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 64, 64)
      }
      return new THREE.CanvasTexture(texCanvas)
    }

    const particleTexture = createGlowTexture()

    // 1. DENSE FIBONACCI SPHERE (5,600 particles)
    const count = SPHERE_CONFIG.particleCount
    const positions = new Float32Array(count * 3)
    const basePositions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const phases = new Float32Array(count)

    const colorHighlight = new THREE.Color(STATE_CONFIGS.idle.primaryColor)
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

      // Depth gradient coloring: bright highlight cyan-white at crests, cyan on edges
      const lerpFactor = (y + 1) * 0.5
      const pColor = colorHighlight.clone().lerp(colorCyan, lerpFactor * 0.8)
      colors[i * 3] = pColor.r
      colors[i * 3 + 1] = pColor.g
      colors[i * 3 + 2] = pColor.b
    }

    const sphereGeometry = new THREE.BufferGeometry()
    sphereGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    sphereGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const sphereMaterial = new THREE.PointsMaterial({
      size: 0.086,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const spherePoints = new THREE.Points(sphereGeometry, sphereMaterial)
    scene.add(spherePoints)

    // 2. INNER CONCENTRATED CYAN ENERGY CORE (1,100 particles)
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

      innerColors[i * 3] = 0.79   // #C9FFFC
      innerColors[i * 3 + 1] = 1.0
      innerColors[i * 3 + 2] = 0.99
    }

    const innerGeometry = new THREE.BufferGeometry()
    innerGeometry.setAttribute('position', new THREE.BufferAttribute(innerPositions, 3))
    innerGeometry.setAttribute('color', new THREE.BufferAttribute(innerColors, 3))

    const innerMaterial = new THREE.PointsMaterial({
      size: 0.11,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const innerPoints = new THREE.Points(innerGeometry, innerMaterial)
    scene.add(innerPoints)

    // 3. SYNAPTIC NEURAL FILAMENTS (Interconnected electric arcs)
    const filamentGroup = new THREE.Group()
    const filamentCount = SPHERE_CONFIG.filamentCount
    const filamentLines: THREE.Line[] = []

    for (let f = 0; f < filamentCount; f++) {
      const theta1 = Math.random() * Math.PI * 2
      const phi1 = Math.acos(Math.random() * 2 - 1)
      const r = SPHERE_CONFIG.baseRadius * 0.98

      const p1 = new THREE.Vector3(
        r * Math.sin(phi1) * Math.cos(theta1),
        r * Math.sin(phi1) * Math.sin(theta1),
        r * Math.cos(phi1)
      )

      const angleOffset = 0.35 + Math.random() * 0.55
      const theta2 = theta1 + angleOffset
      const phi2 = Math.max(0.1, Math.min(Math.PI - 0.1, phi1 + (Math.random() - 0.5) * 0.6))

      const p2 = new THREE.Vector3(
        r * Math.sin(phi2) * Math.cos(theta2),
        r * Math.sin(phi2) * Math.sin(theta2),
        r * Math.cos(phi2)
      )

      const mid = p1.clone().add(p2).multiplyScalar(0.5)
      mid.normalize().multiplyScalar(r * (1.02 + Math.random() * 0.08))

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2)
      const points = curve.getPoints(12)
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)

      const lineMat = new THREE.LineBasicMaterial({
        color: STATE_CONFIGS.idle.coreColor,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      })

      const line = new THREE.Line(lineGeo, lineMat)
      filamentGroup.add(line)
      filamentLines.push(line)
    }

    scene.add(filamentGroup)

    // 4. ELEGANT ORBITAL DATA RINGS (3 inclined rings with luminous cyan nodes)
    const rings: { points: THREE.Points; speed: number }[] = []

    const ringParams = [
      { radius: 2.7, count: 260, rotX: 0.75, rotY: 0.2, speed: 0.5 },
      { radius: 3.0, count: 300, rotX: -0.55, rotY: 0.45, speed: -0.4 },
      { radius: 3.3, count: 340, rotX: 0.35, rotY: -0.7, speed: 0.3 },
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

      const ringPoints = new THREE.Points(ringGeo, ringMat)
      ringPoints.rotation.x = param.rotX
      ringPoints.rotation.y = param.rotY
      scene.add(ringPoints)
      rings.push({ points: ringPoints, speed: param.speed })
    })

    // 5. AMBIENT FIELD DUST PARTICLES
    const dustCount = SPHERE_CONFIG.dustCount
    const dustPositions = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const r = SPHERE_CONFIG.baseRadius + 0.3 + Math.random() * (SPHERE_CONFIG.dustRadius - SPHERE_CONFIG.baseRadius)

      const sinPhi = Math.sin(phi)
      dustPositions[i * 3] = r * sinPhi * Math.cos(theta)
      dustPositions[i * 3 + 1] = r * sinPhi * Math.sin(theta)
      dustPositions[i * 3 + 2] = r * Math.cos(phi)
    }

    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
    const dustMat = new THREE.PointsMaterial({
      size: 0.038,
      color: 0x42f5e9,
      map: particleTexture,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const dustPoints = new THREE.Points(dustGeo, dustMat)
    scene.add(dustPoints)

    // Interactive pointer parallax, gentle field tilt, and click ripple triggers
    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: false,
    }

    const updatePointerCoords = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const relX = ((clientX - rect.left) / rect.width) * 2 - 1
      const relY = -(((clientY - rect.top) / rect.height) * 2 - 1)
      pointer.targetX = Math.max(-1, Math.min(1, relX)) * 0.4
      pointer.targetY = Math.max(-1, Math.min(1, relY)) * 0.35
      pointer.active = true
    }

    const handlePointerMove = (e: MouseEvent) => {
      if (!interactive) return
      updatePointerCoords(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return
      const touch = e.touches[0]
      updatePointerCoords(touch.clientX, touch.clientY)
    }

    const handleTouchEnd = () => {
      pointer.targetX = 0
      pointer.targetY = 0
      pointer.active = false
    }

    // Click/tap ripple effect on the sphere
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY

      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const relX = ((clientX - rect.left) / rect.width) * 2 - 1
      const relY = -(((clientY - rect.top) / rect.height) * 2 - 1)

      const rippleX = relX * SPHERE_CONFIG.baseRadius
      const rippleY = relY * SPHERE_CONFIG.baseRadius
      const rippleZ = Math.sqrt(Math.max(0, SPHERE_CONFIG.baseRadius * SPHERE_CONFIG.baseRadius - rippleX * rippleX - rippleY * rippleY))

      ripplesRef.current.push({
        x: rippleX,
        y: rippleY,
        z: rippleZ,
        startTime: clock.getElapsedTime(),
        intensity: 0.16,
      })

      // Keep maximum 3 concurrent ripples
      if (ripplesRef.current.length > 3) {
        ripplesRef.current.shift()
      }
    }

    if (interactive) {
      window.addEventListener('mousemove', handlePointerMove, { passive: true })
      container.addEventListener('touchmove', handleTouchMove, { passive: true })
      container.addEventListener('touchend', handleTouchEnd, { passive: true })
      container.addEventListener('click', handleClick, { passive: true })
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

      // Smooth parallax dampening
      pointer.x += (pointer.targetX - pointer.x) * 0.05
      pointer.y += (pointer.targetY - pointer.y) * 0.05

      const motionMult = prefersReducedMotion ? 0.15 : 1.0

      // Global rotation + pointer tilt
      spherePoints.rotation.y += currentRotationSpeed * 0.65 * delta * motionMult
      spherePoints.rotation.x = pointer.y * 0.45
      spherePoints.rotation.z = pointer.x * 0.25

      filamentGroup.rotation.y = spherePoints.rotation.y
      filamentGroup.rotation.x = spherePoints.rotation.x
      filamentGroup.rotation.z = spherePoints.rotation.z

      innerPoints.rotation.y -= currentRotationSpeed * 0.9 * delta * motionMult
      innerPoints.rotation.x = -pointer.y * 0.35

      // Surface organic waves & breathing pulse
      const posAttr = sphereGeometry.attributes.position as THREE.BufferAttribute
      const colAttr = sphereGeometry.attributes.color as THREE.BufferAttribute
      const posArr = posAttr.array as Float32Array
      const colArr = colAttr.array as Float32Array

      // Real microphone audio analysis & frequency band deconstruction
      let audioVolume = 0
      let bassVolume = 0
      let trebleVolume = 0

      const now = performance.now()
      const isWarm = audioDataRef.current.readyTime > 0 && now >= audioDataRef.current.readyTime

      if (isListeningRef.current && audioDataRef.current.analyser && audioDataRef.current.dataArray && isWarm) {
        audioDataRef.current.analyser.getByteFrequencyData(audioDataRef.current.dataArray)
        const data = audioDataRef.current.dataArray
        const len = data.length

        // Partition frequencies: low/bass (0 to len/4) vs high/treble (len/4 to len)
        const bassCutoff = Math.max(1, Math.floor(len * 0.25))
        let totalSum = 0
        let bassSum = 0
        let trebleSum = 0

        for (let b = 0; b < len; b++) {
          const val = data[b]
          totalSum += val
          if (b < bassCutoff) {
            bassSum += val
          } else {
            trebleSum += val
          }
        }

        const avg = Math.min(1.0, totalSum / len / 255)
        const rawBass = Math.min(1.0, bassSum / bassCutoff / 255)
        const rawTreble = Math.min(1.0, trebleSum / (len - bassCutoff) / 255)

        // Noise gate: ignore background noise and mic hiss below threshold
        const gatedAvg = avg < 0.05 ? 0 : (avg - 0.05) / 0.95
        const gatedBass = rawBass < 0.05 ? 0 : (rawBass - 0.05) / 0.95
        const gatedTreble = rawTreble < 0.05 ? 0 : (rawTreble - 0.05) / 0.95

        // Asymmetric attack/release smoothing (fast gentle attack, smooth gradual release)
        const attackCoeff = 0.18
        const releaseCoeff = 0.06

        const volCoeff = gatedAvg > audioDataRef.current.smoothedVolume ? attackCoeff : releaseCoeff
        const bassCoeff = gatedBass > audioDataRef.current.bassVolume ? attackCoeff : releaseCoeff
        const trebleCoeff = gatedTreble > audioDataRef.current.trebleVolume ? attackCoeff : releaseCoeff

        audioDataRef.current.smoothedVolume += (gatedAvg - audioDataRef.current.smoothedVolume) * volCoeff
        audioDataRef.current.bassVolume += (gatedBass - audioDataRef.current.bassVolume) * bassCoeff
        audioDataRef.current.trebleVolume += (gatedTreble - audioDataRef.current.trebleVolume) * trebleCoeff

        // Clamp extreme peaks
        audioVolume = Math.min(0.85, Math.max(0, audioDataRef.current.smoothedVolume))
        bassVolume = Math.min(0.85, Math.max(0, audioDataRef.current.bassVolume))
        trebleVolume = Math.min(0.85, Math.max(0, audioDataRef.current.trebleVolume))
      } else if (isSpeakingRef.current) {
        // Expressive speaking cadence matching human speech syllables and rhythms
        const speechEnvelope = 0.5 + 0.5 * Math.sin(time * 3.8)
        const voiceCadence = Math.max(0, Math.sin(time * 8.2) * 0.4 + Math.sin(time * 14.5) * 0.25)
        audioVolume = 0.04 + speechEnvelope * voiceCadence * 0.25
        bassVolume = audioVolume * 0.75
        trebleVolume = audioVolume * 0.95
      } else if (audioDataRef.current.smoothedVolume > 0.001) {
        // Smoothly settle back to 0 when not listening or before warmup
        audioDataRef.current.smoothedVolume *= 0.88
        audioDataRef.current.bassVolume *= 0.88
        audioDataRef.current.trebleVolume *= 0.88
      }

      // Gentle, bounded breathing pulse (maximum 1-2% additional variation)
      const breathingPulse = 1.0 + Math.sin(time * currentPulseSpeed) * currentPulseScale + (audioVolume * 0.015 + bassVolume * 0.008)

      // Pointer-responsive particle displacement
      const pointerInfluenceX = pointer.x * 0.4
      const pointerInfluenceY = pointer.y * 0.4

      // Filter active ripples
      const activeRipples = ripplesRef.current.filter((rip) => time - rip.startTime < 1.4)
      ripplesRef.current = activeRipples

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const bx = basePositions[i3]
        const by = basePositions[i3 + 1]
        const bz = basePositions[i3 + 2]

        // Subtle, smooth wave modulation (never high-frequency shake)
        const wave = Math.sin(time * (currentWaveSpeed + trebleVolume * 0.3) + phases[i] * 2.2) * (0.038 + audioVolume * 0.008) * motionMult

        // Calculate click ripples travelling across sphere surface
        let rippleOffset = 0
        if (activeRipples.length > 0) {
          for (let rIdx = 0; rIdx < activeRipples.length; rIdx++) {
            const rip = activeRipples[rIdx]
            const ripAge = time - rip.startTime
            const dist = Math.sqrt((bx - rip.x) ** 2 + (by - rip.y) ** 2 + (bz - rip.z) ** 2)
            const waveFront = ripAge * 2.8
            const waveDiff = Math.abs(dist - waveFront)
            if (waveDiff < 0.6) {
              const decay = Math.max(0, 1 - ripAge / 1.4)
              rippleOffset += Math.sin((0.6 - waveDiff) * Math.PI) * rip.intensity * decay
            }
          }
        }

        const scale = breathingPulse + wave + rippleOffset

        // Subtle displacement towards cursor
        const dx = bx * scale + (bz > 0 ? pointerInfluenceX * (bz / SPHERE_CONFIG.baseRadius) : 0)
        const dy = by * scale + (bz > 0 ? pointerInfluenceY * (bz / SPHERE_CONFIG.baseRadius) : 0)
        const dz = bz * scale

        posArr[i3] = dx
        posArr[i3 + 1] = dy
        posArr[i3 + 2] = dz

        // Luminous gradient: Ice cyan crests, electric cyan / turquoise silhouette
        const normY = (by / SPHERE_CONFIG.baseRadius + 1) * 0.5
        const boost = audioVolume * 0.18
        colArr[i3] = Math.min(1.0, currentPrimary.r * (1 - normY * 0.35) + currentSecondary.r * (normY * 0.35) + boost)
        colArr[i3 + 1] = Math.min(1.0, currentPrimary.g * (1 - normY * 0.35) + currentSecondary.g * (normY * 0.35) + boost)
        colArr[i3 + 2] = Math.min(1.0, currentPrimary.b * (1 - normY * 0.35) + currentSecondary.b * (normY * 0.35) + boost)
      }

      posAttr.needsUpdate = true
      colAttr.needsUpdate = true

      // Inner core pulse with gentle, controlled voice reactive bass expansion (bounded)
      const innerScale = 1.0 + Math.sin(time * currentPulseSpeed * 1.6) * (currentPulseScale * 1.8) + (bassVolume * 0.025 + audioVolume * 0.012)
      innerPoints.scale.set(innerScale, innerScale, innerScale)

      const innerColAttr = innerGeometry.attributes.color as THREE.BufferAttribute
      const innerColArr = innerColAttr.array as Float32Array
      for (let i = 0; i < innerCount; i++) {
        const i3 = i * 3
        innerColArr[i3] = Math.min(1.0, currentCore.r + audioVolume * 0.15)
        innerColArr[i3 + 1] = Math.min(1.0, currentCore.g + audioVolume * 0.15)
        innerColArr[i3 + 2] = Math.min(1.0, currentCore.b + audioVolume * 0.15)
      }
      innerColAttr.needsUpdate = true

      // Filaments energy update with speech intensity
      filamentLines.forEach((line) => {
        const mat = line.material as THREE.LineBasicMaterial
        mat.color.copy(currentCore)
        mat.opacity = 0.65 + audioVolume * 0.2
      })

      // Rings rotation reacting gently and smoothly to speech rhythm
      rings.forEach((ring) => {
        ring.points.rotation.z += ring.speed * (currentRingSpeed + audioVolume * 0.25) * delta * 0.5 * motionMult
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
        container.removeEventListener('touchmove', handleTouchMove)
        container.removeEventListener('touchend', handleTouchEnd)
        container.removeEventListener('click', handleClick)
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
      {/* Soft, restrained cyan aura backing glow */}
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
