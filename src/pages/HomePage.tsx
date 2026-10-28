import '../styles/HomePage.css'

interface HomePageProps {
  onEnterDashboard: () => void
}

export function HomePage({ onEnterDashboard }: HomePageProps) {
  const sixCapabilities = [
    {
      number: '01',
      title: 'Adaptive Investigation Engine',
      summary: 'Autonomous search vector formulation with real-time coverage satisfaction checks and explicit stopping rationale.',
    },
    {
      number: '02',
      title: 'Assumption Autopsy',
      summary: 'Rigorous decomposition of complex claims into underlying premises, structural vulnerabilities, and evidence coverage.',
    },
    {
      number: '03',
      title: 'Live Investigation Timeline',
      summary: 'Transparent research telemetry displaying dispatched queries, discoveries, and contradictions as they unfold.',
    },
    {
      number: '04',
      title: 'Steelman vs. Red Team',
      summary: 'Bilateral dialectic presenting the strongest affirmative case alongside substantive counter-arguments fairly.',
    },
    {
      number: '05',
      title: 'Evidence Receipts',
      summary: 'Granular source citations with verified stance tags (Supporting, Contradicting), methodology notes, and external URLs.',
    },
    {
      number: '06',
      title: 'Empirical Falsification Plan',
      summary: 'Operational test procedures and quantitative thresholds required to refute findings and challenge conclusions.',
    },
  ]

  const methodologySteps = [
    {
      step: '01',
      title: 'Decompose the Claim',
      desc: 'Isolate underlying empirical assumptions from rhetorical confidence or cognitive bias.',
    },
    {
      step: '02',
      title: 'Adversarial Retrieval',
      desc: 'Query independent scientific indices specifically for disconfirming data and null results.',
    },
    {
      step: '03',
      title: 'Calibrate Uncertainty',
      desc: 'Weigh methodological rigor, sample sizes, and conflicts of interest without sycophancy.',
    },
  ]

  return (
    <div className="landing-container">
      <div className="landing-page">
      {/* Top Informational Navigation */}
      <nav className="landing-nav" aria-label="Main Navigation">
        <div className="landing-brand">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">CONTRA <span className="brand-dim">/ AI</span></span>
        </div>

        <div className="landing-nav-actions">
          <a href="#capabilities" className="nav-link">Capabilities</a>
          <a href="#methodology" className="nav-link">Methodology</a>
          <a href="#preview" className="nav-link">Dossier Preview</a>
          <button
            type="button"
            className="launch-dashboard-btn"
            onClick={onEnterDashboard}
          >
            <span>Start investigating</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Informational Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <div className="hero-pill-tag">
            <span className="pill-dot" aria-hidden="true" />
            <span>POWERED BY NVIDIA NEMOTRON</span>
          </div>

          <h1 className="hero-main-title">
            Evidence-driven research that challenges your assumptions.
          </h1>

          <p className="hero-description">
            Most search tools and AI models fall victim to affirmative sycophancy — confirming what you ask.
            <strong> Contra</strong> autonomously investigates both supporting and contradictory evidence,
            exposing vulnerabilities, evidence gaps, and empirical falsification thresholds.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="hero-primary-btn"
              onClick={onEnterDashboard}
            >
              <span>Start investigating</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <a href="#capabilities" className="hero-secondary-btn">
              <span>Explore capabilities</span>
            </a>
          </div>
        </div>
      </header>

      {/* Six Signature Capabilities Grid */}
      <section id="capabilities" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">RESEARCH ARCHITECTURE</span>
          <h2 className="section-title">The Six Signature Capabilities</h2>
          <p className="section-lead">
            Every investigation executes through a non-dogmatic adversarial workflow designed to preserve research integrity.
          </p>
        </div>

        <div className="capabilities-grid">
          {sixCapabilities.map((cap) => (
            <article key={cap.number} className="capability-card">
              <span className="capability-num">{cap.number}</span>
              <h3 className="capability-title">{cap.title}</h3>
              <p className="capability-summary">{cap.summary}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">HOW IT WORKS</span>
          <h2 className="section-title">De-biasing the Research Workflow</h2>
          <p className="section-lead">
            Contra does not blindly agree or disagree. It synthesizes findings based on empirical proof and explicit uncertainty acknowledgment.
          </p>
        </div>

        <div className="methodology-grid">
          {methodologySteps.map((item) => (
            <div key={item.step} className="methodology-card">
              <span className="methodology-step">{item.step}</span>
              <h3 className="methodology-title">{item.title}</h3>
              <p className="methodology-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Evidence Dossier Subtle Preview */}
      <section id="preview" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">EVIDENCE SYNTHESIS PREVIEW</span>
          <h2 className="section-title">Granular, Source-Cited Receipts</h2>
          <p className="section-lead">
            Preview the structure of an authentic synthesized dossier before launching your own investigation.
          </p>
        </div>

        <div className="preview-container">
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-badge-row">
                <span className="preview-badge preview-badge-active">SYNTHESIZED DOSSIER</span>
                <span className="preview-meta">HYPOTHESIS CASE STUDY</span>
              </div>
              <h3 className="preview-query">
                &ldquo;Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles.&rdquo;
              </h3>
            </div>

            <div className="preview-body">
              <div className="preview-stat-row">
                <div className="preview-stat">
                  <span className="stat-label">BIAS RATING</span>
                  <span className="stat-value text-accent">Conditional / Nuanced</span>
                </div>
                <div className="preview-stat">
                  <span className="stat-label">CERTAINTY SCORE</span>
                  <span className="stat-value">62%</span>
                </div>
                <div className="preview-stat">
                  <span className="stat-label">SOURCES ANALYZED</span>
                  <span className="stat-value">14 Studies</span>
                </div>
              </div>

              <div className="preview-finding">
                <span className="finding-label">EXECUTIVE CONCLUSION:</span>
                <p className="finding-text">
                  Manufacturing carbon deficit (40–60% higher initial emissions) is amortized within 22,000 km
                  on average global electrical grids. However, under heavy thermal-coal grid infrastructure (&gt;80%),
                  the breakeven extends to 85,000+ km, validating conditional counter-claims.
                </p>
              </div>

              <div className="preview-receipts-snippet">
                <span className="receipts-label">EVIDENCE RECEIPTS EXCERPT:</span>
                <div className="receipt-pill-item">
                  <span className="receipt-tag tag-support">Supporting</span>
                  <span className="receipt-source">Argonne National Laboratory (GREET Model)</span>
                </div>
                <div className="receipt-pill-item">
                  <span className="receipt-tag tag-contra">Contradicting</span>
                  <span className="receipt-source">International Council on Clean Transportation (ICCT)</span>
                </div>
              </div>
            </div>

            <div className="preview-footer">
              <button
                type="button"
                className="preview-cta-btn"
                onClick={onEnterDashboard}
              >
                <span>Investigate this claim in Dashboard</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Action Footer Banner */}
      <section className="cta-banner-section">
        <div className="cta-card">
          <div className="cta-text">
            <h2>Ready to challenge a hypothesis?</h2>
            <p>Access the investigation dashboard, dispatch adversarial queries, and review cited evidence.</p>
          </div>
          <button
            type="button"
            className="hero-primary-btn"
            onClick={onEnterDashboard}
          >
            <span>Start investigating</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </section>

      {/* Simple Accessible Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <span className="footer-copy">Contra AI — Dialectical Evidence Engine</span>
          <a href="#dashboard" onClick={(e) => { e.preventDefault(); onEnterDashboard(); }} className="footer-link">
            Launch Dashboard
          </a>
        </div>
      </footer>
    </div>
  </div>
  )
}
