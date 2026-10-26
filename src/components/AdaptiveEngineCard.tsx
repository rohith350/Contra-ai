import '../styles/AdaptiveEngineCard.css'

interface AdaptiveEngineCardProps {
  hypothesis: string
  activeQuery: string
  claimsDecomposed: string[]
  coverageScore: number
  stoppingRationale: string
}

export function AdaptiveEngineCard({
  hypothesis,
  activeQuery,
  claimsDecomposed,
  coverageScore,
  stoppingRationale,
}: AdaptiveEngineCardProps) {
  return (
    <div className="adaptive-card">
      <div className="adaptive-header">
        <div className="adaptive-tag-row">
          <span className="adaptive-badge">SIGNATURE CAPABILITY 01</span>
          <span className="adaptive-title">Adaptive Investigation Engine</span>
        </div>
        <p className="adaptive-sub">
          Dialectical decomposition running autonomous search branches with active coverage verification and stopping heuristics.
        </p>
      </div>

      <div className="adaptive-focus-box">
        <span className="box-label">TARGET HYPOTHESIS:</span>
        <h4 className="target-claim">&ldquo;{hypothesis}&rdquo;</h4>
      </div>

      {/* Decomposition Premise List */}
      <div className="decomposition-section">
        <span className="section-label">ACTIVE SUBCLAIM BRANCHES:</span>
        <div className="claims-tag-grid">
          {claimsDecomposed.map((claim, idx) => (
            <div key={idx} className="claim-branch-item">
              <span className="branch-dot" />
              <span>{claim}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dispatched Query Monitor */}
      <div className="query-stream-card">
        <div className="stream-header">
          <span className="stream-status-dot" />
          <span className="stream-title">ACTIVE ADVERSARIAL QUERY DISPATCH:</span>
        </div>
        <code className="active-query-code">{activeQuery}</code>
      </div>

      {/* Coverage Progress Bar & Stopping Rationale */}
      <div className="coverage-bar-group">
        <div className="coverage-label-row">
          <span className="cov-label">DIALECTICAL COVERAGE SATISFACTION:</span>
          <span className="cov-score">{coverageScore}%</span>
        </div>
        <div className="cov-track">
          <div className="cov-fill" style={{ width: `${coverageScore}%` }} />
        </div>
        <p className="stopping-text">
          <strong className="stop-label">Stopping Criteria: </strong>
          {stoppingRationale}
        </p>
      </div>
    </div>
  )
}
