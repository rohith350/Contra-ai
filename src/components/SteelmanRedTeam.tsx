import type { DialecticalCase } from '../types/investigation'
import '../styles/SteelmanRedTeam.css'

interface SteelmanRedTeamProps {
  steelman: DialecticalCase
  redTeam: DialecticalCase
}

export function SteelmanRedTeam({ steelman, redTeam }: SteelmanRedTeamProps) {
  return (
    <div className="dialectical-card">
      <div className="dialectical-header">
        <div className="dialectical-tag-row">
          <span className="dialectical-badge">SIGNATURE CAPABILITY 04</span>
          <span className="dialectical-title">Steelman vs. Red Team</span>
        </div>
        <p className="dialectical-sub">
          Adversarial dialectic: presenting the strongest affirmative evidence against the most robust empirical counter-arguments.
        </p>
      </div>

      <div className="dialectical-grid">
        {/* Steelman Affirmative Case */}
        <div className="case-column steelman-col">
          <div className="case-top">
            <span className="case-pill steelman-pill">Steelman Case</span>
            <span className="case-subtag">STRONGEST SUPPORTING ARGUMENT</span>
          </div>

          <h4 className="case-title">{steelman.title}</h4>
          <p className="case-argument">{steelman.coreArgument}</p>

          <div className="case-findings">
            <span className="findings-label">KEY SUPPORTING OBSERVATIONS:</span>
            <ul>
              {steelman.keyFindings.map((finding, idx) => (
                <li key={idx}>{finding}</li>
              ))}
            </ul>
          </div>

          <div className="case-sources">
            <span className="source-label">KEY CITATIONS:</span>
            <div className="source-chips">
              {steelman.primarySources.map((src, idx) => (
                <span key={idx} className="source-chip">{src}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Red Team Counter Case */}
        <div className="case-column redteam-col">
          <div className="case-top">
            <span className="case-pill redteam-pill">Red Team Case</span>
            <span className="case-subtag">ADVERSARIAL REFUTATION</span>
          </div>

          <h4 className="case-title">{redTeam.title}</h4>
          <p className="case-argument">{redTeam.coreArgument}</p>

          <div className="case-findings">
            <span className="findings-label">KEY CONFLICTING OBSERVATIONS:</span>
            <ul>
              {redTeam.keyFindings.map((finding, idx) => (
                <li key={idx}>{finding}</li>
              ))}
            </ul>
          </div>

          <div className="case-sources">
            <span className="source-label">KEY CITATIONS:</span>
            <div className="source-chips">
              {redTeam.primarySources.map((src, idx) => (
                <span key={idx} className="source-chip">{src}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
