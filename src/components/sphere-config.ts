import type { SphereAnimationState, StateVisualConfig } from '../types/sphere'

export const SPHERE_CONFIG = {
  particleCount: 5200,      // Denser spherical silhouette
  baseRadius: 2.1,
  coreRadius: 1.15,
  innerParticles: 950,      // Dense luminous core
  filamentCount: 38,        // Neural synaptic filaments
  filamentSegments: 16,
  orbitRingCount: 3,
  dustCount: 220,
  dustRadius: 3.6,
  minDpr: 1,
  maxDpr: 2,
}

export const STATE_CONFIGS: Record<SphereAnimationState, StateVisualConfig> = {
  idle: {
    coreColor: 0x4ef2dc,        // Crisp radiant cyan/mint
    primaryColor: 0xffffff,     // Brilliant crisp white
    secondaryColor: 0x0099bb,   // Deep cyan edge
    rotationSpeed: 0.35,
    waveSpeed: 1.1,
    pulseSpeed: 1.0,
    pulseScale: 0.05,
    particleOpacity: 0.95,
    ringSpeed: 0.45,
    bloomStrength: 0.65,
  },
  listening: {
    coreColor: 0x67ffff,        // Hyper-bright cyan
    primaryColor: 0xffffff,     // Pure white
    secondaryColor: 0x22d3ee,   // Electric cyan
    rotationSpeed: 0.52,
    waveSpeed: 1.8,
    pulseSpeed: 2.2,
    pulseScale: 0.08,
    particleOpacity: 1.0,
    ringSpeed: 0.75,
    bloomStrength: 0.85,
  },
  researching: {
    coreColor: 0x38bdf8,        // Sky blue
    primaryColor: 0x67e8f9,     // Light cyan
    secondaryColor: 0x0284c7,   // Deep cobalt
    rotationSpeed: 1.15,
    waveSpeed: 3.2,
    pulseSpeed: 2.8,
    pulseScale: 0.11,
    particleOpacity: 1.0,
    ringSpeed: 1.4,
    bloomStrength: 0.95,
  },
  'report-ready': {
    coreColor: 0x34d399,        // Vibrant emerald mint
    primaryColor: 0xffffff,     // Crisp white
    secondaryColor: 0x059669,   // Deep teal
    rotationSpeed: 0.38,
    waveSpeed: 1.2,
    pulseSpeed: 1.1,
    pulseScale: 0.06,
    particleOpacity: 0.95,
    ringSpeed: 0.5,
    bloomStrength: 0.8,
  },
  error: {
    coreColor: 0xf43f5e,        // Warning rose
    primaryColor: 0xfca5a5,     // Soft salmon
    secondaryColor: 0x9f1239,   // Deep crimson
    rotationSpeed: 0.22,
    waveSpeed: 0.6,
    pulseSpeed: 0.7,
    pulseScale: 0.04,
    particleOpacity: 0.8,
    ringSpeed: 0.25,
    bloomStrength: 0.5,
  },
}
