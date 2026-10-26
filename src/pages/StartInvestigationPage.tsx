import { useState } from 'react'
import { ContraAISphere } from '../components/ContraAISphere'
import { InvestigationPanel } from '../components/InvestigationPanel'
import '../styles/StartInvestigationPage.css'

interface StartInvestigationPageProps {
  onStartInvestigation: (hypothesis: string) => void
  onNavigateHome: () => void
}

export function StartInvestigationPage({
  onStartInvestigation,
  onNavigateHome,
}: StartInvestigationPageProps) {
  const [coreState, setCoreState] = useState<'idle' | 'listening'>('idle')

  return (
    <div className="start-investigation-page">
      {/* Top Navigation */}
      <nav className="start-nav">
        <button
          type="button"
          className="back-btn"
          onClick={onNavigateHome}
          title="Back to Overview"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Overview</span>
        </button>

        <div className="nav-title-block">
          <span className="nav-pill-dot" />
          <span className="nav-step-title">STEP 01: HYPOTHESIS INTAKE</span>
        </div>
      </nav>

      {/* Main Form & Neural Standby Grid */}
      <div className="start-grid">
        <div className="start-form-col">
          <header className="start-header">
            <span className="eyebrow">RESEARCH AGENT INTAKE</span>
            <h1 className="start-title">State your hypothesis to challenge.</h1>
            <p className="start-desc">
              Contra autonomously analyzes empirical literature, cross-referencing supporting claims
              against opposing research to identify confirmation bias.
            </p>
          </header>

          <div className="start-panel-card">
            <InvestigationPanel
              currentState={coreState}
              onStateChange={(st) => {
                if (st === 'idle' || st === 'listening') setCoreState(st)
              }}
              onInvestigate={onStartInvestigation}
            />
          </div>
        </div>

        <div className="start-preview-col">
          <div className="preview-card">
            <div className="preview-header">
              <span className="p-title">NEURAL CORE STANDBY</span>
              <span className="p-mode">READY</span>
            </div>

            <div className="sphere-wrapper">
              <ContraAISphere
                state={coreState}
                size={400}
                label="ACOUSTIC / PROMPT SENSORS STANDBY"
                interactive={true}
              />
            </div>

            <div className="preflight-box">
              <span className="preflight-title">PRE-FLIGHT CRITERIA:</span>
              <ul className="preflight-list">
                <li>✓ Clear, testable causal assertion</li>
                <li>✓ Empirical falsifiability condition defined</li>
                <li>✓ Dual-stream adversarial search primed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
