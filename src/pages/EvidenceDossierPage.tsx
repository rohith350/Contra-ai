import { AssumptionAutopsy } from '../components/AssumptionAutopsy'
import { SteelmanRedTeam } from '../components/SteelmanRedTeam'
import { EvidenceReceipts } from '../components/EvidenceReceipts'
import { FalsificationCard } from '../components/FalsificationCard'
import type { InvestigationReport } from '../types/investigation'
import '../styles/EvidenceDossierPage.css'

interface EvidenceDossierPageProps {
  report: InvestigationReport
  onNewInvestigation: () => void
  onNavigateHome: () => void
}

export function EvidenceDossierPage({
  report,
  onNewInvestigation,
  onNavigateHome,
}: EvidenceDossierPageProps) {
  return (
    <div className="dossier-page">
      {/* Top Dossier Nav */}
      <nav className="dossier-nav">
        <div className="dossier-nav-left">
          <button type="button" className="nav-btn" onClick={onNavigateHome}>
            <span>Overview</span>
          </button>
          <div className="nav-sep" />
          <div className="dossier-id-block">
            <span className="dossier-dot" />
            <span className="dossier-id">EVIDENCE DOSSIER // {report.id}</span>
          </div>
        </div>

        <div className="dossier-nav-right">
          <button type="button" className="new-investigation-btn" onClick={onNewInvestigation}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Investigation</span>
          </button>
        </div>
      </nav>

      {/* Dossier Executive Summary & Verdict Header */}
      <header className="dossier-header-card">
        <div className="header-meta-bar">
          <span className="dossier-tag">SYNTHESIZED ADVERSARIAL REPORT</span>
          <span className="dossier-date">{new Date(report.timestamp).toLocaleDateString()}</span>
          <span className="dossier-consensus-tag">{report.biasIndex}</span>
        </div>

        <div className="investigated-claim-row">
          <span className="claim-prompt-label">INVESTIGATED HYPOTHESIS:</span>
          <h1 className="claim-title">&ldquo;{report.hypothesis}&rdquo;</h1>
        </div>

        <div className="verdict-banner">
          <div className="verdict-col-score">
            <span className="score-num">{report.certaintyScore}%</span>
            <span className="score-label">Certainty Index</span>
          </div>
          <div className="verdict-col-text">
            <span className="verdict-eyebrow">DIALECTICAL SYNTHESIS VERDICT:</span>
            <p className="verdict-body">{report.verdictSummary}</p>
          </div>
        </div>
      </header>

      {/* Core Signature Capabilities Sections */}
      <section className="dossier-sections-stack">
        {/* Capability 02: Assumption Autopsy */}
        <AssumptionAutopsy assumptions={report.assumptions} />

        {/* Capability 04: Steelman vs. Red Team */}
        <SteelmanRedTeam steelman={report.steelman} redTeam={report.redTeam} />

        {/* Capability 05: Evidence Receipts */}
        <EvidenceReceipts receipts={report.evidenceReceipts} />

        {/* Capability 06: Empirical Falsification Plan */}
        <FalsificationCard plan={report.falsificationPlan} />
      </section>

      {/* Footer Return CTA */}
      <div className="dossier-footer-actions">
        <button type="button" className="new-investigation-btn footer-btn" onClick={onNewInvestigation}>
          <span>Start Another Investigation</span>
        </button>
      </div>
    </div>
  )
}
