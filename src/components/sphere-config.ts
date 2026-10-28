import type { SphereAnimationState, StateVisualConfig } from '../types/sphere'

export const SPHERE_CONFIG = {
  particleCount: 5600,      // Dense, recognizable spherical silhouette
  baseRadius: 2.1,
  coreRadius: 1.15,
  innerParticles: 1100,     // Concentrated luminous cyan energy core
  filamentCount: 42,        // Delicate interconnected neural filaments
  filamentSegments: 16,
  orbitRingCount: 3,
  dustCount: 240,
  dustRadius: 3.6,
  minDpr: 1,
  maxDpr: 2,
}

// Cyan & Turquoise Color Tokens aligned with user requirements:
// Background: #050505
// Primary Cyan: #42F5E9 (0x42f5e9)
// Turquoise: #35D9D0 (0x35d9d0)
// Bright Highlight: #C9FFFC (0xc9fffc)
// Muted Cyan: #168F9A (0x168f9a)

export const STATE_CONFIGS: Record<SphereAnimationState, StateVisualConfig> = {
  idle: {
    coreColor: 0x42f5e9,        // Electric cyan energy core
    primaryColor: 0xc9fffc,     // Bright ice cyan highlight approaching white
    secondaryColor: 0x168f9a,   // Muted deep cyan outer surface
    rotationSpeed: 0.32,
    waveSpeed: 1.1,
    pulseSpeed: 1.0,
    pulseScale: 0.05,
    particleOpacity: 0.95,
    ringSpeed: 0.45,
    bloomStrength: 0.65,
  },
  listening: {
    coreColor: 0xc9fffc,        // Luminous white-cyan core showing voice capture readiness
    primaryColor: 0x42f5e9,     // Electric cyan waves
    secondaryColor: 0x35d9d0,   // Turquoise outer envelope
    rotationSpeed: 0.35,        // Calm baseline, matches idle (0.32) without sudden speed jump
    waveSpeed: 1.15,            // Calm baseline, matches idle (1.10) without surface oscillation
    pulseSpeed: 1.05,           // Calm breathing cadence, matches idle (1.00)
    pulseScale: 0.05,           // Matches idle pulse scale exactly (0.05) to eliminate scale jumps
    particleOpacity: 1.0,
    ringSpeed: 0.48,            // Matches idle ring speed (0.45)
    bloomStrength: 0.85,
  },
  speaking: {
    coreColor: 0xffffff,        // Brilliant white-cyan glowing energy core
    primaryColor: 0x42f5e9,     // Luminous energetic cyan pulse
    secondaryColor: 0x35d9d0,   // Flowing turquoise filaments
    rotationSpeed: 0.65,
    waveSpeed: 2.4,
    pulseSpeed: 2.6,
    pulseScale: 0.12,
    particleOpacity: 1.0,
    ringSpeed: 0.95,
    bloomStrength: 0.95,
  },
  researching: {
    coreColor: 0x42f5e9,        // Electric cyan fast-flowing filaments
    primaryColor: 0xc9fffc,     // Bright ice cyan filaments
    secondaryColor: 0x168f9a,   // Deep cyan contrast
    rotationSpeed: 1.15,
    waveSpeed: 3.2,
    pulseSpeed: 2.8,
    pulseScale: 0.11,
    particleOpacity: 1.0,
    ringSpeed: 1.4,
    bloomStrength: 0.95,
  },
  'report-ready': {
    coreColor: 0x35d9d0,        // Stable, clear turquoise glow
    primaryColor: 0xc9fffc,     // Bright ice highlight
    secondaryColor: 0x168f9a,   // Muted cyan
    rotationSpeed: 0.35,
    waveSpeed: 1.1,
    pulseSpeed: 1.0,
    pulseScale: 0.05,
    particleOpacity: 0.95,
    ringSpeed: 0.45,
    bloomStrength: 0.75,
  },
  error: {
    coreColor: 0xf43f5e,        // Restrained warning rose
    primaryColor: 0xfca5a5,     // Soft salmon
    secondaryColor: 0x9f1239,   // Deep crimson
    rotationSpeed: 0.2,
    waveSpeed: 0.5,
    pulseSpeed: 0.7,
    pulseScale: 0.03,
    particleOpacity: 0.75,
    ringSpeed: 0.2,
    bloomStrength: 0.4,
  },
}
