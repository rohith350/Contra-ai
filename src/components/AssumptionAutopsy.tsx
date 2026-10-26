import type { AssumptionItem } from '../types/investigation'
import '../styles/AssumptionAutopsy.css'

interface AssumptionAutopsyProps {
  assumptions: AssumptionItem[]
}

export function AssumptionAutopsy({ assumptions }: AssumptionAutopsyProps) {
  return (
    <div className="autopsy-card">
      <div className="autopsy-header">
        <div className="autopsy-tag-row">
          <span className="autopsy-badge">SIGNATURE CAPABILITY 02</span>
          <span className="autopsy-title">Assumption Autopsy</span>
        </div>
        <p className="autopsy-desc">
          Deconstructing the hypothesis into core subclaims, exposing structural vulnerabilities,
          and measuring empirical validation coverage.
        </p>
      </div>

      <div className="assumptions-table">
        {assumptions.map((item, index) => {
          const statusClass =
            item.status === 'supported'
              ? 'status-supported'
              : item.status === 'contradicted'
              ? 'status-contradicted'
              : 'status-unresolved'

          const statusLabel =
            item.status === 'supported'
              ? 'Empirically Supported'
              : item.status === 'contradicted'
              ? 'Contradicted by Data'
              : 'Unresolved / Gap'

          return (
            <div key={item.id} className="assumption-row">
              <div className="assumption-meta">
                <span className="assumption-num">P{index + 1}</span>
                <span className={`assumption-status-pill ${statusClass}`}>
                  <span className="status-dot" />
                  <span>{statusLabel}</span>
                </span>
                <span className="coverage-badge">Coverage: {item.coveragePercent}%</span>
              </div>

              <div className="assumption-body">
                <h4 className="premise-text">&ldquo;{item.premise}&rdquo;</h4>
                <div className="vulnerability-box">
                  <span className="vuln-label">Methodological Audit:</span>
                  <p className="vuln-text">{item.vulnerability}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
