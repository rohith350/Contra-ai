import { NextSteps } from '../components/NextSteps'
import '../styles/HomePage.css'

interface HomePageProps {
  onEnterDashboard: () => void
}

export function HomePage({ onEnterDashboard }: HomePageProps) {
  const corePillars = [
    {
      step: '01',
      title: 'Hypothesis Decomposition',
      desc: 'Contra breaks down complex propositions into testable premises, isolating causal assertions from underlying cognitive biases.',
    },
    {
      step: '02',
      title: 'Dialectical Evidence Search',
      desc: 'Searches peer-reviewed databases and high-credibility primary sources for both supporting citations and contradictory evidence.',
    },
    {
      step: '03',
      title: 'Source Credibility & Gaps',
      desc: 'Evaluates methodological rigor, checks funding conflicts, and identifies critical evidence gaps where consensus is absent.',
    },
    {
      step: '04',
      title: 'Balanced Dossier Synthesis',
      desc: 'Compiles cited counter-briefs with calibrated certainty ratings, helping researchers make sound, evidence-grounded decisions.',
    },
  ]

  const sampleScenarios = [
    {
      badge: 'Software Architecture',
      query: 'Microservices architecture always reduces organizational latency compared to modular monoliths.',
      analysis: 'Identifies operational overhead, distributed network failures, and Conway’s law trade-offs against modular alternatives.',
    },
    {
      badge: 'Public Health & Nutrition',
      query: 'High dietary sodium intake is universally detrimental regardless of potassium ratio or physical conditioning.',
      analysis: 'Cross-examines landmark trials against recent athletic physiology research on electrolyte balance.',
    },
    {
      badge: 'Economics & Energy',
      query: 'Transitioning to 100% renewables guarantees immediate regional electrical grid stability.',
      analysis: 'Surfaces empirical intermittency data, battery storage density limitations, and baseload infrastructure requirements.',
    },
  ]

  return (
    <div className="landing-page">
      {/* Top Informational Navigation */}
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="brand-dot" />
          <span className="brand-name">CONTRA <span className="brand-dim">/ AI</span></span>
        </div>
        <div className="landing-nav-actions">
          <a href="#how-it-works" className="nav-link">Methodology</a>
          <a href="#case-studies" className="nav-link">Analysis Cases</a>
          <button
            type="button"
            className="launch-dashboard-btn"
            onClick={onEnterDashboard}
          >
            <span>Launch Research Lab</span>
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
            <span className="pill-dot" />
            <span>NVIDIA NEMOTRON POWERED RESEARCH AGENT</span>
          </div>

          <h1 className="hero-main-title">
            The Autonomous Anti-Confirmation Bias Intelligence.
          </h1>

          <p className="hero-description">
            Human intuition instinctively searches for facts that reinforce existing beliefs.
            <strong> Contra</strong> systematically challenges your assumptions by actively seeking out,
            verifying, and synthesizing credible counter-evidence to reveal the complete picture.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="hero-primary-btn"
              onClick={onEnterDashboard}
            >
              <span>Enter Investigation Workbench</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <a href="#how-it-works" className="hero-secondary-btn">
              <span>Read Architecture Overview</span>
            </a>
          </div>
        </div>
      </header>

      {/* Methodology & How It Works Section */}
      <section id="how-it-works" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">SYSTEM ARCHITECTURE</span>
          <h2 className="section-title">How Contra De-biases Research</h2>
          <p className="section-lead">
            Traditional AI assistants validate prompt biases through affirmative sycophancy.
            Contra enforces dual-stream adversarial analysis on every claim.
          </p>
        </div>

        <div className="pillars-grid">
          {corePillars.map((pillar) => (
            <div key={pillar.step} className="pillar-card">
              <span className="pillar-step">{pillar.step}</span>
              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-desc">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Case Studies / Evidence Analysis Scenarios */}
      <section id="case-studies" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">RESEARCH SCENARIOS</span>
          <h2 className="section-title">Dialectical Fact-Checking in Action</h2>
          <p className="section-lead">
            Review how Contra decomposes widely accepted dogmas and uncovers nuances often lost to confirmation bias.
          </p>
        </div>

        <div className="scenarios-list">
          {sampleScenarios.map((sc, i) => (
            <div key={i} className="scenario-card">
              <div className="scenario-top">
                <span className="scenario-badge">{sc.badge}</span>
                <span className="scenario-meta">ADVERSARIAL EVALUATION</span>
              </div>
              <h3 className="scenario-query">&ldquo;{sc.query}&rdquo;</h3>
              <div className="scenario-analysis">
                <span className="analysis-tag">Counter-Synthesis:</span>
                <p className="analysis-text">{sc.analysis}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Direct Call to Action Banner */}
      <section className="cta-banner-section">
        <div className="cta-card">
          <div className="cta-text">
            <h2>Ready to stress-test your hypothesis?</h2>
            <p>Access the live neural core workbench and analyze evidence across verified repositories.</p>
          </div>
          <button
            type="button"
            className="hero-primary-btn"
            onClick={onEnterDashboard}
          >
            <span>Launch Research Lab</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </section>

      {/* Preserved Documentation and Community Links */}
      <section className="supporting-section">
        <NextSteps />
      </section>
    </div>
  )
}
