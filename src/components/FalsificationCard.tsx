import type { FalsificationPlan } from '../types/investigation'
import '../styles/FalsificationCard.css'

interface FalsificationCardProps {
  plan: FalsificationPlan
}

export function FalsificationCard({ plan }: FalsificationCardProps) {
  return (
    <div className="falsification-card">
      <div className="falsification-header">
        <div className="falsification-tag-row">
          <span className="falsification-badge">SIGNATURE CAPABILITY 06</span>
          <span className="falsification-title">Empirical Falsification Plan</span>
        </div>
        <p className="falsification-sub">
          Contra grounds every inquiry in Popperian falsifiability: defining the explicit test conditions and empirical thresholds that would refute our current synthesis.
        </p>
      </div>

      <div className="falsification-grid">
        <div className="plan-item">
          <span className="plan-label">01 / Operational Testing Procedure:</span>
          <p className="plan-text">{plan.testProcedure}</p>
        </div>

        <div className="plan-item">
          <span className="plan-label">02 / Measurable Benchmark Metric:</span>
          <p className="plan-text">{plan.measurableMetric}</p>
        </div>

        <div className="plan-item highlight-plan">
          <span className="plan-label">03 / Falsification Threshold:</span>
          <p className="plan-text">{plan.falsificationThreshold}</p>
        </div>

        <div className="plan-item">
          <span className="plan-label">04 / Required Counter-Evidence:</span>
          <p className="plan-text">{plan.counterEvidenceRequired}</p>
        </div>
      </div>
    </div>
  )
}
