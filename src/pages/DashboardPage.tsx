import { useState } from 'react'
import type { SphereAnimationState } from '../types/sphere'
import { ContraAISphere } from '../components/ContraAISphere'
import { InvestigationPanel } from '../components/InvestigationPanel'
import '../styles/DashboardPage.css'

interface DashboardPageProps {
  onNavigateHome: () => void
}

export function DashboardPage({ onNavigateHome }: DashboardPageProps) {
  const [coreState, setCoreState] = useState<SphereAnimationState>('idle')
  const [activeHypothesis, setActiveHypothesis] = useState<string | null>(null)

  const handleInvestigate = (hypothesis: string) => {
    setActiveHypothesis(hypothesis)
    setCoreState('researching')

    setTimeout(() => {
      setCoreState('report-ready')
    }, 4500)
  }

  const getStatusLabel = (state: SphereAnimationState) => {
    switch (state) {
      case 'idle':
        return 'NEURAL CORE • STANDBY'
      case 'listening':
        return 'PROMPT SENSORS • ACTIVE'
      case 'researching':
        return 'EVIDENCE SYNTHESIS • ACTIVE'
      case 'report-ready':
        return 'ANALYSIS COMPLETE • READY'
      case 'error':
        return 'ANOMALY DETECTED'
    }
  }

  return (
    <div className="dashboard-page">
      {/* Top Application Header */}
      <nav className="dashboard-nav">
        <div className="dash-brand-group">
          <button
            type="button"
            className="back-to-home-btn"
            onClick={onNavigateHome}
            title="Return to Contra AI overview"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Overview</span>
          </button>
          <div className="dash-divider" />
          <div className="dash-brand">
            <span className="dash-dot" />
            <span className="dash-title">CONTRA <span className="dash-dim">/ RESEARCH LAB</span></span>
          </div>
        </div>

        <div className="dash-status-pill">
          <span className="status-indicator" />
          <span className="meta-text">{getStatusLabel(coreState)}</span>
        </div>
      </nav>

      {/* Main Interactive Investigation Dashboard Layout */}
      <div className="dashboard-grid">
        {/* Left Interactive Column: Controls, Hypothesis Input, and Live Investigation */}
        <div className="dashboard-left-col">
          <div className="dash-panel-header">
            <span className="dash-badge">INVESTIGATION WORKBENCH</span>
            <h1 className="dash-heading">Analyze Claims & Assumptions</h1>
            <p className="dash-sub">
              Input a hypothesis to decompose claims, analyze supporting and contradictory evidence,
              and detect cognitive bias.
            </p>
          </div>

          <div className="dash-workbench-card">
            <InvestigationPanel
              currentState={coreState}
              onStateChange={setCoreState}
              onInvestigate={handleInvestigate}
            />

            {activeHypothesis && (
              <div className="current-stream-info">
                <span className="stream-badge">Investigating:</span>
                <span className="stream-claim">&ldquo;{activeHypothesis}&rdquo;</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Visual Column: Living Neural Core Focal Point */}
        <div className="dashboard-right-col">
          <div className="sphere-viewport-card">
            <div className="viewport-header">
              <span className="vp-title">NEURAL CORE MATRIX</span>
              <span className="vp-tag">NVIDIA NEMOTRON POWERED</span>
            </div>
            <div className="sphere-center-stage">
              <ContraAISphere
                state={coreState}
                size={440}
                label={getStatusLabel(coreState)}
                interactive={true}
              />
            </div>
            <div className="viewport-footer">
              <div className="vp-stat">
                <span className="stat-label">SYNAPTIC CORE</span>
                <span className="stat-value">5,200 NODES</span>
              </div>
              <div className="vp-stat">
                <span className="stat-label">BIAS FILTER</span>
                <span className="stat-value">ACTIVE</span>
              </div>
              <div className="vp-stat">
                <span className="stat-label">TELEMETRY</span>
                <span className="stat-value">STREAMING</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
