import { useState, useEffect } from 'react'
import { ContraAISphere } from '../components/ContraAISphere'
import { AdaptiveEngineCard } from '../components/AdaptiveEngineCard'
import { LiveTimeline } from '../components/LiveTimeline'
import type { TimelineEvent } from '../types/investigation'
import '../styles/LiveInvestigationPage.css'

interface LiveInvestigationPageProps {
  hypothesis: string
  onComplete: () => void
  onCancel: () => void
}

export function LiveInvestigationPage({
  hypothesis,
  onComplete,
  onCancel,
}: LiveInvestigationPageProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [coverageScore, setCoverageScore] = useState(18)
  const [activeQuery, setActiveQuery] = useState(
    'electric vehicle lifecycle emissions vs hybrid EPA NREL 2025'
  )

  const liveTimeline: TimelineEvent[] = [
    {
      id: 'step-1',
      timeOffset: '0.0s',
      type: 'search',
      query: 'electric vehicle lifecycle emissions vs hybrid EPA NREL 2025',
      headline: 'Decomposing Hypothesis & Formulating Search Vectors',
      detail: 'Isolating mineral extraction, cell manufacturing, grid operational factors, and end-of-life battery recycling.',
    },
    {
      id: 'step-2',
      timeOffset: '1.4s',
      type: 'discovery',
      headline: 'Manufacturing Carbon Deficit Confirmed',
      detail: 'Identified 40–60% higher initial production carbon footprint for battery-electric powertrains vs. standard hybrids.',
      source: 'Argonne National Laboratory',
    },
    {
      id: 'step-3',
      timeOffset: '2.8s',
      type: 'contradiction',
      headline: 'Operational Efficiency Breakeven Discovered',
      detail: 'Operational energy conversion efficiency amortizes upfront manufacturing debt within 22,000 km on average global grids.',
      source: 'International Council on Clean Transportation (ICCT)',
    },
    {
      id: 'step-4',
      timeOffset: '3.8s',
      type: 'gap',
      headline: 'Sensitivity Boundary: High-Coal Regional Grids',
      detail: 'Identified breakeven extension to 85,000+ km under grid generation containing >80% thermal coal.',
      source: 'Nature Energy Meta-Analysis',
    },
    {
      id: 'step-5',
      timeOffset: '4.8s',
      type: 'decision',
      headline: 'Stopping Criteria Satisfied • Synthesis Ready',
      detail: 'Evidence saturation achieved across 24 peer-reviewed datasets. Compiling Evidence Dossier.',
    },
  ]

  // Sequential progression through research events
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStepIndex(1)
      setCoverageScore(42)
      setActiveQuery('EV battery manufacturing carbon footprint Argonne GREET 2024')
    }, 1500)

    const timer2 = setTimeout(() => {
      setStepIndex(2)
      setCoverageScore(68)
      setActiveQuery('tank to wheel vs well to wheel efficiency Atkinson cycle ICCT')
    }, 3000)

    const timer3 = setTimeout(() => {
      setStepIndex(3)
      setCoverageScore(88)
      setActiveQuery('coal grid electricity intensity lifecycle sensitivity passenger cars')
    }, 4200)

    const timer4 = setTimeout(() => {
      setStepIndex(4)
      setCoverageScore(100)
      setActiveQuery('SYNTHESIS COMPLETE — EVIDENCE SATURATION REACHED')
    }, 5500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [])

  const decomposedClaims = [
    'Mineral mining and cell fabrication initial carbon load',
    'Operational powertrain thermal efficiency differential',
    'Battery pack longevity vs complete pack replacement requirement',
    'Regional electricity grid decarbonization sensitivity',
  ]

  return (
    <div className="live-page">
      {/* Top Header */}
      <nav className="live-nav">
        <div className="live-brand-block">
          <span className="live-beacon" />
          <span className="live-status-text">
            {stepIndex < 4 ? 'AUTONOMOUS ADVERSARIAL RESEARCH IN PROGRESS' : 'SYNTHESIS COMPLETE'}
          </span>
        </div>

        <div className="live-actions">
          {stepIndex < 4 ? (
            <button type="button" className="abort-btn" onClick={onCancel}>
              <span>Abort Session</span>
            </button>
          ) : (
            <button type="button" className="complete-btn" onClick={onComplete}>
              <span>Open Evidence Dossier</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* Main Grid: Adaptive Engine + Live Timeline on Left, 3D Sphere on Right */}
      <div className="live-grid">
        <div className="live-left-col">
          <AdaptiveEngineCard
            hypothesis={hypothesis}
            activeQuery={activeQuery}
            claimsDecomposed={decomposedClaims}
            coverageScore={coverageScore}
            stoppingRationale="Saturation reached across 24 lifecycle assessments. Both affirmative and counter-evidence documented."
          />

          <div className="timeline-wrapper-card">
            <LiveTimeline timeline={liveTimeline} activeStepIndex={stepIndex} />
          </div>

          {stepIndex >= 4 && (
            <div className="ready-action-banner">
              <div className="banner-text">
                <strong>Investigation Complete.</strong> Balanced dialectical counter-brief compiled.
              </div>
              <button type="button" className="complete-btn" onClick={onComplete}>
                <span>Proceed to Evidence Dossier</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="live-right-col">
          <div className="live-sphere-card">
            <div className="sphere-card-header">
              <span className="sc-title">NVIDIA NEMOTRON NEURAL CORE</span>
              <span className="sc-mode">{stepIndex < 4 ? 'RESEARCHING' : 'READY'}</span>
            </div>

            <div className="sphere-stage-live">
              <ContraAISphere
                state={stepIndex < 4 ? 'researching' : 'report-ready'}
                size={440}
                label={stepIndex < 4 ? 'EVIDENCE SYNTHESIS • ACTIVE' : 'SYNTHESIS COMPLETE'}
                interactive={true}
              />
            </div>

            <div className="live-telemetry-row">
              <div className="tel-block">
                <span className="tel-label">DIALECTICAL BEACONS</span>
                <span className="tel-val">{stepIndex < 4 ? 'DISPATCHING' : 'RESOLVED'}</span>
              </div>
              <div className="tel-block">
                <span className="tel-label">SOURCES QUERIED</span>
                <span className="tel-val">{stepIndex * 6 + 4} LCAs</span>
              </div>
              <div className="tel-block">
                <span className="tel-label">BIAS FILTER</span>
                <span className="tel-val">ENGAGED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
