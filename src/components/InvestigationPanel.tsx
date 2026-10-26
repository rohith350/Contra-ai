import { useState, useId, type FormEvent } from 'react'
import type { SphereAnimationState } from '../types/sphere'
import '../styles/InvestigationPanel.css'

interface InvestigationPanelProps {
  onInvestigate: (hypothesis: string) => void
  currentState: SphereAnimationState
  onStateChange: (state: SphereAnimationState) => void
}

export function InvestigationPanel({
  onInvestigate,
  currentState,
  onStateChange,
}: InvestigationPanelProps) {
  const [hypothesis, setHypothesis] = useState('')
  const [showDevControls, setShowDevControls] = useState(false)
  const inputId = useId()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!hypothesis.trim() || currentState === 'researching') return
    onInvestigate(hypothesis.trim())
  }

  const sampleHypotheses = [
    {
      topic: 'Engineering & Innovation',
      claim: 'Remote work decreases long-term engineering innovation and cross-team serendipity',
    },
    {
      topic: 'Software Reliability',
      claim: 'AI code generation tools increase defect density in mission-critical production systems',
    },
    {
      topic: 'Metabolic Science',
      claim: 'Intermittent fasting outperforms caloric restriction for biomarkers and longevity',
    },
  ]

  const handleSelectSample = (claimText: string) => {
    setHypothesis(claimText)
    if (currentState === 'idle') {
      onStateChange('listening')
    }
  }

  return (
    <div className="investigation-container">
      {/* Primary Hypothesis Input & Action */}
      <form onSubmit={handleSubmit} className="hypothesis-form">
        <div className="label-row">
          <label htmlFor={inputId} className="hypothesis-label">
            Hypothesis or Claim to Investigate
          </label>
          <span className="hypothesis-hint">
            Contra cross-examines supporting vs. conflicting evidence
          </span>
        </div>

        <div className="input-action-row">
          <div className="input-field-wrapper">
            <span className="input-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              id={inputId}
              type="text"
              className="hypothesis-input"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              onFocus={() => {
                if (currentState === 'idle') onStateChange('listening')
              }}
              onBlur={() => {
                if (currentState === 'listening' && !hypothesis.trim()) onStateChange('idle')
              }}
              placeholder="e.g. Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles..."
              disabled={currentState === 'researching'}
            />
          </div>

          <button
            type="submit"
            className={`investigate-btn ${currentState === 'researching' ? 'btn-loading' : ''}`}
            disabled={!hypothesis.trim() || currentState === 'researching'}
          >
            {currentState === 'researching' ? (
              <>
                <span className="spinner-dot" aria-hidden="true" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Begin Investigation</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Interactive Sample Hypotheses */}
      <div className="sample-prompts">
        <span className="sample-title">Select hypothesis to test:</span>
        <div className="sample-list">
          {sampleHypotheses.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={`sample-chip ${hypothesis === item.claim ? 'chip-active' : ''}`}
              onClick={() => handleSelectSample(item.claim)}
            >
              <span className="chip-topic">{item.topic}</span>
              <span className="chip-quote">&ldquo;{item.claim}&rdquo;</span>
            </button>
          ))}
        </div>
      </div>

      {/* Development / Testing State Controls (Cleanly togglable, separated from hero) */}
      <div className="dev-state-toggle-row">
        <button
          type="button"
          className="dev-toggle-btn"
          onClick={() => setShowDevControls((prev) => !prev)}
        >
          <span>{showDevControls ? 'Hide Simulation Panel' : 'Simulation Controls (Dev)'}</span>
        </button>

        {showDevControls && (
          <div className="state-controls-bar">
            <span className="controls-label">Core State:</span>
            <div className="state-buttons">
              {(['idle', 'listening', 'researching', 'report-ready', 'error'] as SphereAnimationState[]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    data-state={st}
                    className={`state-tab ${currentState === st ? 'active' : ''}`}
                    onClick={() => onStateChange(st)}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
