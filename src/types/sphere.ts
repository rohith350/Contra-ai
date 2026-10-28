export type SphereAnimationState =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'researching'
  | 'report-ready'
  | 'error'

export interface ContraAISphereProps {
  state?: SphereAnimationState
  className?: string
  size?: number
  interactive?: boolean
  label?: string
  isListening?: boolean
  isSpeaking?: boolean
}

export interface StateVisualConfig {
  coreColor: number
  primaryColor: number
  secondaryColor: number
  rotationSpeed: number
  waveSpeed: number
  pulseSpeed: number
  pulseScale: number
  particleOpacity: number
  ringSpeed: number
  bloomStrength: number
}
