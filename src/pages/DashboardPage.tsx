import { useState, useRef } from 'react'
import type { SphereAnimationState } from '../types/sphere'
import type { InvestigationReport, TimelineEvent } from '../types/investigation'
import { ContraAISphere } from '../components/ContraAISphere'
import { ChatGPTComposer, type AttachedSource } from '../components/ChatGPTComposer'
import { AdaptiveEngineCard } from '../components/AdaptiveEngineCard'
import { LiveTimeline } from '../components/LiveTimeline'
import { AssumptionAutopsy } from '../components/AssumptionAutopsy'
import { SteelmanRedTeam } from '../components/SteelmanRedTeam'
import { EvidenceReceipts } from '../components/EvidenceReceipts'
import { FalsificationCard } from '../components/FalsificationCard'
import { SAMPLE_INVESTIGATION_REPORT } from '../services/sample-report'
import { createInvestigation, subscribeInvestigationEvents } from '../services/api'
import { useVoiceAgent } from '../hooks/useVoiceAgent'
import '../styles/DashboardPage.css'
import '../styles/VoiceAgent.css'

interface DashboardPageProps {
  onNavigateHome: () => void
}

type WorkspaceState = 'welcome' | 'researching' | 'completed' | 'error'
type ResearchStage = 'preparing' | 'researching' | 'analyzing'
type DossierTab = 'synthesis' | 'autopsy' | 'dialectic' | 'receipts' | 'falsification' | 'timeline'

interface HistoryEntry {
  id: string
  hypothesis: string
  timestamp: string
  certaintyScore: number
  biasIndex: string
  sourcesCount?: number
}

export function DashboardPage({ onNavigateHome }: DashboardPageProps) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('welcome')
  const [researchStage, setResearchStage] = useState<ResearchStage>('preparing')
  const [hypothesis, setHypothesis] = useState('')
  const [activeHypothesis, setActiveHypothesis] = useState('')
  const [activeSources, setActiveSources] = useState<AttachedSource[]>([])
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [activeReport, setActiveReport] = useState<InvestigationReport>(SAMPLE_INVESTIGATION_REPORT)
  const [activeTab, setActiveTab] = useState<DossierTab>('synthesis')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: 'inv-case-01',
      hypothesis: 'Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles.',
      timestamp: 'Today',
      certaintyScore: 62,
      biasIndex: 'Conditional / Nuanced',
      sourcesCount: 2,
    },
    {
      id: 'inv-case-02',
      hypothesis: 'Remote work reduces long-term engineering innovation and cross-team serendipity.',
      timestamp: 'Yesterday',
      certaintyScore: 48,
      biasIndex: 'Weak Evidence Base',
      sourcesCount: 1,
    },
  ])

  // Active Research Telemetry State
  const [coverageScore, setCoverageScore] = useState(18)
  const [activeQuery, setActiveQuery] = useState('')
  const [timelineStepIndex, setTimelineStepIndex] = useState(0)
  const [liveTimeline, setLiveTimeline] = useState<TimelineEvent[]>([])
  const [decomposedClaims, setDecomposedClaims] = useState<string[]>([
    'Initial fabrication and manufacturing carbon load',
    'Operational powertrain thermal efficiency differential',
    'Component lifecycle durability vs replacement requirements',
    'Regional infrastructure decarbonization sensitivity',
  ])
  const timeoutsRef = useRef<number[]>([])
  const sseTeardownRef = useRef<(() => void) | null>(null)

  // Suggested Hypotheses
  const sampleHypotheses = [
    {
      topic: 'Mobility & Energy',
      claim: 'Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles.',
    },
    {
      topic: 'Software Engineering',
      claim: 'AI code generation increases defect density in critical production systems.',
    },
    {
      topic: 'Organizational Behavior',
      claim: 'Remote work decreases long-term engineering innovation and cross-team serendipity.',
    },
  ]

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id))
    timeoutsRef.current = []
  }

  const runLocalSimulation = (trimmed: string, attachedSources: AttachedSource[]) => {
    // Stage progression fallback: preparing -> researching -> analyzing -> report-ready
    const t0 = window.setTimeout(() => {
      setResearchStage('researching')
    }, 600)

    const t1 = window.setTimeout(() => {
      setCoverageScore(55)
      setTimelineStepIndex(2)
      setActiveQuery(`${trimmed.slice(0, 40)}... counter-evidence & null results`)
    }, 1500)

    const t2 = window.setTimeout(() => {
      setResearchStage('analyzing')
      setCoverageScore(85)
      setTimelineStepIndex(3)
      setActiveQuery(`${trimmed.slice(0, 40)}... replication studies`)
    }, 3000)

    const t3 = window.setTimeout(() => {
      setCoverageScore(100)
      setTimelineStepIndex(4)
      const synthesizedReport: InvestigationReport = {
        ...SAMPLE_INVESTIGATION_REPORT,
        id: `inv-${Date.now().toString().slice(-4)}`,
        hypothesis: trimmed,
        timestamp: new Date().toISOString(),
      }
      setActiveReport(synthesizedReport)
      setWorkspaceState('completed')
      setActiveTab('synthesis')

      setHistory((prev) => [
        {
          id: synthesizedReport.id,
          hypothesis: trimmed,
          timestamp: 'Just now',
          certaintyScore: synthesizedReport.certaintyScore,
          biasIndex: synthesizedReport.biasIndex,
          sourcesCount: attachedSources.length,
        },
        ...prev.filter((h) => h.hypothesis !== trimmed),
      ])
    }, 4500)

    timeoutsRef.current = [t0, t1, t2, t3]
  }

  const handleStartInvestigation = async (targetClaim: string, attachedSources: AttachedSource[] = []) => {
    const trimmed = targetClaim.trim()
    if (!trimmed || workspaceState === 'researching') return

    clearAllTimeouts()
    if (sseTeardownRef.current) {
      sseTeardownRef.current()
      sseTeardownRef.current = null
    }

    setActiveHypothesis(trimmed)
    setActiveSources(attachedSources)
    setWorkspaceState('researching')
    setResearchStage('preparing')
    setCoverageScore(15)
    setTimelineStepIndex(0)
    setActiveQuery(`${trimmed.slice(0, 45)}... meta-analysis 2025`)

    const initialEvents: TimelineEvent[] = [
      {
        id: 'init-step-1',
        timeOffset: '0.0s',
        type: 'search',
        query: `${trimmed.slice(0, 50)}... empirical studies 2025`,
        headline: 'Decomposing Hypothesis & Formulating Search Vectors',
        detail: 'Isolating fundamental causal claims from rhetoric; querying independent scientific indexes for null and contradictory results.',
        source: 'NVIDIA Nemotron Reasoner',
      },
    ]
    setLiveTimeline(initialEvents)

    try {
      const res = await createInvestigation(trimmed, attachedSources)
      const invId = res.id

      const unsubscribe = subscribeInvestigationEvents(invId, {
        onProgress: (data) => {
          if (typeof data.progress_percent === 'number') {
            setCoverageScore(data.progress_percent)
          }
          if (data.current_stage) {
            if (data.current_stage === 'preparing' || data.current_stage === 'researching' || data.current_stage === 'analyzing') {
              setResearchStage(data.current_stage)
            }
          }
          if (data.current_query) {
            setActiveQuery(data.current_query)
          }
          if (data.claims_decomposed && data.claims_decomposed.length > 0) {
            setDecomposedClaims(data.claims_decomposed)
          }
        },
        onTimeline: (event) => {
          setLiveTimeline((prev) => {
            if (prev.some((e) => e.id === event.id)) return prev
            return [...prev, event]
          })
          setTimelineStepIndex((idx) => idx + 1)
        },
        onComplete: (report) => {
          setCoverageScore(100)
          setActiveReport(report)
          setWorkspaceState('completed')
          setActiveTab('synthesis')

          setHistory((prev) => [
            {
              id: report.id,
              hypothesis: trimmed,
              timestamp: 'Just now',
              certaintyScore: report.certaintyScore,
              biasIndex: report.biasIndex,
              sourcesCount: attachedSources.length,
            },
            ...prev.filter((h) => h.hypothesis !== trimmed),
          ])
        },
        onInconclusive: ({ report }) => {
          setCoverageScore(100)
          setActiveReport(report)
          setWorkspaceState('completed')
          setActiveTab('synthesis')
        },
        onError: (err) => {
          console.warn('Backend stream error, running simulation fallback:', err)
          runLocalSimulation(trimmed, attachedSources)
        },
      })

      sseTeardownRef.current = unsubscribe
    } catch (err) {
      console.warn('Backend unreachable, using local mock simulation:', err)
      runLocalSimulation(trimmed, attachedSources)
    }
  }

  const handleCancelInvestigation = () => {
    clearAllTimeouts()
    if (sseTeardownRef.current) {
      sseTeardownRef.current()
      sseTeardownRef.current = null
    }
    setWorkspaceState('welcome')
  }

  const handleNewInvestigation = () => {
    clearAllTimeouts()
    if (sseTeardownRef.current) {
      sseTeardownRef.current()
      sseTeardownRef.current = null
    }
    setWorkspaceState('welcome')
    setHypothesis('')
    setActiveHypothesis('')
    setActiveSources([])
    setIsVoiceListening(false)
    setActiveTab('synthesis')
    setSidebarOpen(false)
  }

  const handleLoadHistory = (item: HistoryEntry) => {
    clearAllTimeouts()
    setActiveHypothesis(item.hypothesis)
    setHypothesis(item.hypothesis)
    setActiveReport({
      ...SAMPLE_INVESTIGATION_REPORT,
      id: item.id,
      hypothesis: item.hypothesis,
      certaintyScore: item.certaintyScore,
      biasIndex: item.biasIndex,
    })
    setWorkspaceState('completed')
    setActiveTab('synthesis')
    setSidebarOpen(false)
  }

  const [isAISpeaking, setIsAISpeaking] = useState(false)

  // ── Voice Agent (Nemotron-powered real-time voice conversation) ───────────
  const voice = useVoiceAgent()



  // Sync legacy isVoiceListening flag from the ChatGPTComposer mic with voice agent state
  // (the composer's own STT populates the hypothesis field; the voice agent is for freeform chat)

  const handleToggleAISpeech = () => {
    if (!('speechSynthesis' in window)) return

    if (isAISpeaking) {
      window.speechSynthesis.cancel()
      setIsAISpeaking(false)
      return
    }

    const textToSpeak = `${activeReport.hypothesis}. Executive conclusion: ${activeReport.verdictSummary}`
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => {
      setIsAISpeaking(true)
    }

    utterance.onend = () => {
      setIsAISpeaking(false)
    }

    utterance.onerror = () => {
      setIsAISpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  // Derive genuine sphere animation state from workspace and voice agent
  const getSphereState = (): SphereAnimationState => {
    if (isAISpeaking) return 'speaking'
    if (voice.agentState === 'speaking') return 'speaking'
    if (voice.agentState === 'thinking') return 'researching'
    if (voice.agentState === 'listening') return 'listening'
    if (workspaceState === 'researching') return 'researching'
    if (workspaceState === 'completed') return 'report-ready'
    if (workspaceState === 'error') return 'error'
    if (isVoiceListening) return 'listening'
    return 'idle'
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-text">CONTRA <span className="brand-dim">/ LAB</span></span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>

        {/* Primary Action: New Investigation */}
        <div className="sidebar-action-wrap">
          <button
            type="button"
            className="new-investigation-btn"
            onClick={handleNewInvestigation}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Investigation</span>
          </button>
        </div>

        {/* Real Session History List */}
        <div className="sidebar-history-section">
          <span className="sidebar-section-title">RECENT INVESTIGATIONS</span>
          <div className="sidebar-history-list">
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`history-item-btn ${
                  activeHypothesis === item.hypothesis && workspaceState === 'completed' ? 'active-history' : ''
                }`}
                onClick={() => handleLoadHistory(item)}
              >
                <span className="history-item-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </span>
                <span className="history-item-text" title={item.hypothesis}>
                  {item.hypothesis}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Return to Landing Page */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="return-overview-btn"
            onClick={onNavigateHome}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Return to Overview</span>
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="dashboard-main">
        {/* Top Minimal Toolbar */}
        <header className="workspace-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="workspace-state-badge">
              <span className="state-pulse" aria-hidden="true" />
              <span className="state-label">
                {workspaceState === 'welcome' && (isVoiceListening ? 'VOICE SENSORS ACTIVE â€¢ LISTENING' : 'READY â€¢ ENTER HYPOTHESIS')}
                {workspaceState === 'researching' && researchStage === 'preparing' && 'PREPARING â€¢ VECTOR DECOMPOSITION'}
                {workspaceState === 'researching' && researchStage === 'researching' && 'RESEARCHING â€¢ RETRIEVING SOURCES & CITATIONS'}
                {workspaceState === 'researching' && researchStage === 'analyzing' && 'ANALYZING â€¢ MODEL PROCESSING EVIDENCE'}
                {workspaceState === 'completed' && 'REPORT READY â€¢ EVIDENCE DOSSIER'}
                {workspaceState === 'error' && 'INVESTIGATION HALTED'}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <span className="engine-model-tag">NVIDIA NEMOTRON</span>
          </div>
        </header>

        {/* WORKSPACE CONTENT STAGE */}
        <div className="workspace-stage">
          {/* ================================================================ */}
          {/* STATE A: WELCOME / INTAKE STATE                                  */}
          {/* ================================================================ */}
          {workspaceState === 'welcome' && (
            <div className="welcome-container">
              {/* Prominent Living Cyan Neural Sphere */}
              <div className="welcome-sphere-frame" aria-hidden="true">
                <ContraAISphere
                  state={getSphereState()}
                  size={370}
                  label={
                    isAISpeaking
                      ? 'AI VOICE SYNTHESIS â€¢ ACTIVE'
                      : voice.agentState === 'speaking'
                        ? 'CONTRA AI • SPEAKING'
                        : voice.agentState === 'thinking'
                          ? 'NEMOTRON • PROCESSING'
                          : (voice.agentState === 'listening' || isVoiceListening)
                            ? 'VOICE CAPTURE • ACTIVE'
                            : 'NEURAL CORE • READY'
                  }
                  interactive={true}
                  isListening={isVoiceListening || voice.agentState === 'listening'}
                  isSpeaking={isAISpeaking || voice.agentState === 'speaking'}
                  className="welcome-sphere-hero"
                />
              </div>

              <div className="welcome-intro">
                <h1 className="welcome-title">Challenge a hypothesis.</h1>
              </div>

              {/* Sample Prompt Chips */}
              <div className="sample-prompts-container">
                <span className="sample-prompts-label">EXAMPLE HYPOTHESES:</span>
                <div className="sample-prompts-grid">
                  {sampleHypotheses.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="sample-prompt-chip"
                      onClick={() => setHypothesis(item.claim)}
                    >
                      <span className="chip-topic">{item.topic}</span>
                      <span className="chip-text">&ldquo;{item.claim}&rdquo;</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ChatGPT-Style Input Composer */}
              <div className="welcome-composer-wrapper">
                <ChatGPTComposer
                  hypothesis={hypothesis}
                  onHypothesisChange={setHypothesis}
                  onInvestigate={(claim, sources) => handleStartInvestigation(claim, sources)}
                  isResearching={false}
                  isListening={isVoiceListening}
                  onListeningChange={setIsVoiceListening}
                  placeholder="Enter a hypothesis to investigate..."
                />
              </div>

              {/* Voice Agent Panel - Nemotron-powered real-time voice conversation */}
              {voice.isSpeechAvailable && (
                <>
                  <hr className="voice-panel-divider" aria-hidden="true" />
                  <section
                    className="voice-agent-panel"
                    aria-label="Voice conversation with Contra AI"
                  >
                    <div className="voice-controls">
                      <button
                        type="button"
                        className={[
                          'voice-mic-btn',
                          voice.agentState === 'listening' ? 'listening'   : '',
                          voice.agentState === 'thinking'  ? 'thinking'    : '',
                          voice.agentState === 'speaking'  ? 'speaking'    : '',
                          voice.agentState === 'error'     ? 'error-state' : '',
                        ].join(' ').trim()}
                        onClick={() => {
                          if (voice.agentState === 'listening') {
                            voice.stopListening()
                          } else if (voice.agentState === 'speaking') {
                            voice.stopSpeaking()
                          } else if (voice.agentState === 'idle' || voice.agentState === 'error') {
                            voice.startListening()
                          }
                        }}
                        aria-label={
                          voice.agentState === 'listening'
                            ? 'Stop listening'
                            : voice.agentState === 'speaking'
                              ? 'Stop speaking'
                              : 'Start voice conversation'
                        }
                        disabled={voice.agentState === 'thinking'}
                        aria-disabled={voice.agentState === 'thinking'}
                      >
                        {voice.agentState === 'thinking' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                        ) : voice.agentState === 'speaking' ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                          </svg>
                        ) : voice.agentState === 'listening' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="5" y1="8" x2="5" y2="16" />
                            <line x1="9" y1="5" x2="9" y2="19" />
                            <line x1="13" y1="8" x2="13" y2="16" />
                            <line x1="17" y1="10" x2="17" y2="14" />
                            <line x1="21" y1="11" x2="21" y2="13" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                          </svg>
                        )}
                      </button>

                      <div className="voice-status-group">
                        <span
                          className={[
                            'voice-status-label',
                            voice.agentState === 'listening' ? 'active'   : '',
                            voice.agentState === 'thinking'  ? 'thinking' : '',
                            voice.agentState === 'speaking'  ? 'speaking' : '',
                            voice.agentState === 'error'     ? 'error'    : '',
                          ].join(' ').trim()}
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          {voice.agentState === 'idle'      && 'VOICE AI \u2022 TAP TO SPEAK'}
                          {voice.agentState === 'listening' && 'LISTENING \u2022 SPEAK NOW'}
                          {voice.agentState === 'thinking'  && 'NEMOTRON \u2022 THINKING'}
                          {voice.agentState === 'speaking'  && 'CONTRA AI \u2022 SPEAKING'}
                          {voice.agentState === 'error'     && 'ERROR \u2022 TAP TO RETRY'}
                        </span>
                        {(voice.transcript || voice.interimTranscript) && (
                          <p className="voice-transcript-preview" aria-live="polite">
                            {voice.transcript && <span>{voice.transcript}</span>}
                            {voice.interimTranscript && (
                              <span className="interim"> {voice.interimTranscript}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {voice.errorMessage && (
                      <div className="voice-error-banner" role="alert">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {voice.errorMessage}
                      </div>
                    )}

                    {voice.conversation.length > 0 && (
                      <>
                        <div className="voice-conversation" aria-label="Conversation history" aria-live="polite">
                          {voice.conversation.map((turn, idx) => (
                            <div key={idx} className={`voice-turn ${turn.role}`}>
                              <span className="voice-turn-role">
                                {turn.role === 'user' ? 'YOU' : 'CONTRA AI'}
                              </span>
                              <p className="voice-turn-text">{turn.content}</p>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="voice-clear-btn"
                          onClick={voice.clearConversation}
                          aria-label="Clear voice conversation history"
                        >
                          Clear conversation
                        </button>
                      </>
                    )}
                  </section>
                </>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* STATE B: ACTIVE INVESTIGATION (RESEARCHING)                      */}
          {/* ================================================================ */}
          {workspaceState === 'researching' && (
            <div className="researching-container">
              {/* Active Query Banner */}
              <div className="active-query-card">
                <div className="query-status-bar">
                  <span className="query-meta-tag">
                    {researchStage === 'preparing' && 'PREPARING ADVERSARIAL VECTORS'}
                    {researchStage === 'researching' && 'ACTIVE SOURCE & EVIDENCE RETRIEVAL'}
                    {researchStage === 'analyzing' && 'DIALECTICAL SYNTHESIS ANALYSIS'}
                  </span>
                  <button
                    type="button"
                    className="cancel-run-btn"
                    onClick={handleCancelInvestigation}
                  >
                    Cancel run
                  </button>
                </div>
                <h2 className="active-claim-title">&ldquo;{activeHypothesis}&rdquo;</h2>
                {activeSources.length > 0 && (
                  <div className="active-sources-preview">
                    <span className="sources-label">PRIOR CONTEXT SOURCES:</span>
                    {activeSources.map((s) => (
                      <span key={s.id} className="active-source-badge">
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Research Telemetry Grid */}
              <div className="telemetry-grid">
                <div className="telemetry-left">
                  {/* Adaptive Engine Telemetry */}
                  <AdaptiveEngineCard
                    hypothesis={activeHypothesis}
                    coverageScore={coverageScore}
                    activeQuery={activeQuery}
                    claimsDecomposed={decomposedClaims}
                    stoppingRationale={
                      coverageScore >= 100
                        ? 'Evidence saturation satisfied: Bilateral counter-citations retrieved.'
                        : 'Querying high-impact scientific indices for null results...'
                    }
                  />

                  {/* Live Investigation Timeline */}
                  <div className="timeline-card-box">
                    <LiveTimeline
                      timeline={liveTimeline}
                      activeStepIndex={timelineStepIndex}
                    />
                  </div>
                </div>

                <div className="telemetry-right">
                  <div className="telemetry-sphere-card">
                    <div className="sphere-card-header">
                      <span className="sphere-label">NEURAL SYNAPSE HUD</span>
                      <span className="sphere-mode">RESEARCHING</span>
                    </div>
                    <div className="telemetry-sphere-stage">
                      <ContraAISphere
                        state="researching"
                        size={320}
                        label="EVIDENCE RETRIEVAL â€¢ ACTIVE"
                        interactive={false}
                        className="active-sphere"
                      />
                    </div>
                    <div className="sphere-stats-row">
                      <div className="sphere-stat">
                        <span className="s-lbl">COVERAGE</span>
                        <span className="s-val text-accent">{coverageScore}%</span>
                      </div>
                      <div className="sphere-stat">
                        <span className="s-lbl">VECTORS</span>
                        <span className="s-val">8 Dispatched</span>
                      </div>
                      <div className="sphere-stat">
                        <span className="s-lbl">CONTRADICTIONS</span>
                        <span className="s-val">3 Flagged</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STATE C: COMPLETED INVESTIGATION (EVIDENCE DOSSIER)              */}
          {/* ================================================================ */}
          {workspaceState === 'completed' && (
            <div className="dossier-workspace">
              {/* Dossier Header */}
              <header className="dossier-head-panel">
                <div className="dossier-meta-row">
                  <span className="dossier-pill">EVIDENCE DOSSIER // {activeReport.id}</span>
                  <span className="dossier-demo-tag">DEMO / BENCHMARK MODE</span>
                  <span className="dossier-time">{new Date(activeReport.timestamp).toLocaleDateString()}</span>
                  <span className="dossier-consensus">{activeReport.biasIndex}</span>
                  {activeSources.length > 0 && (
                    <span className="dossier-sources-count">{activeSources.length} Prior Source(s)</span>
                  )}
                </div>

                <h1 className="dossier-hypothesis-title">&ldquo;{activeReport.hypothesis}&rdquo;</h1>

                {/* Score & Verdict Banner */}
                <div className="dossier-verdict-grid">
                  <div className="verdict-score-box">
                    <span className="score-number">{activeReport.certaintyScore}%</span>
                    <span className="score-caption">Empirical Certainty</span>
                  </div>
                  <div className="verdict-summary-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span className="verdict-label">EXECUTIVE CONCLUSION</span>
                      {'speechSynthesis' in window && (
                        <button
                          type="button"
                          onClick={handleToggleAISpeech}
                          className="header-action-btn"
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.72rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            borderColor: isAISpeaking ? 'var(--mint)' : undefined,
                            color: isAISpeaking ? 'var(--mint)' : undefined,
                          }}
                          title={isAISpeaking ? 'Stop audio synthesis' : 'Read executive verdict'}
                          aria-label={isAISpeaking ? 'Stop audio synthesis' : 'Read executive verdict'}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {isAISpeaking ? (
                              <rect x="6" y="6" width="12" height="12" rx="2" />
                            ) : (
                              <>
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                              </>
                            )}
                          </svg>
                          <span>{isAISpeaking ? 'Speaking...' : 'Read Aloud'}</span>
                        </button>
                      )}
                    </div>
                    <p className="verdict-text">{activeReport.verdictSummary}</p>
                  </div>
                </div>

                {/* Internal Tabs Navigator */}
                <nav className="dossier-tabs-nav" aria-label="Dossier Section Navigation">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'synthesis' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('synthesis')}
                  >
                    Executive Synthesis
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'autopsy' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('autopsy')}
                  >
                    Assumption Autopsy
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'dialectic' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('dialectic')}
                  >
                    Steelman vs Red Team
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'receipts' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('receipts')}
                  >
                    Evidence Receipts ({activeReport.evidenceReceipts.length})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'falsification' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('falsification')}
                  >
                    Falsification Plan
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'timeline' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                  >
                    Timeline Telemetry
                  </button>
                </nav>
              </header>

              {/* Dossier Dynamic Tab Content */}
              <div className="dossier-tab-view">
                {activeTab === 'synthesis' && (
                  <div className="tab-pane-synthesis">
                    <div className="synthesis-card">
                      <h3 className="pane-title">Dialectical Verdict & Uncertainty Notes</h3>
                      <p className="pane-lead">
                        The empirical evidence exhibits nuanced constraints. While affirmative evidence highlights
                        operational amortization, adversarial citations show significant sensitivity to baseline factors.
                      </p>

                      <div className="takeaways-list">
                        <div className="takeaway-item">
                          <span className="takeaway-tag support">Affirmative Vector:</span>
                          <span className="takeaway-content">Production emissions amortize rapidly under modern grid efficiencies.</span>
                        </div>
                        <div className="takeaway-item">
                          <span className="takeaway-tag contra">Adversarial Vector:</span>
                          <span className="takeaway-content">Extensive coal dependency (&gt;80%) quadruples breakeven distance, validating the boundary condition.</span>
                        </div>
                      </div>
                    </div>

                    {/* Bilateral Summary Snippet */}
                    <SteelmanRedTeam
                      steelman={activeReport.steelman}
                      redTeam={activeReport.redTeam}
                    />
                  </div>
                )}

                {activeTab === 'autopsy' && (
                  <div className="tab-pane-autopsy">
                    <AssumptionAutopsy assumptions={activeReport.assumptions} />
                  </div>
                )}

                {activeTab === 'dialectic' && (
                  <div className="tab-pane-dialectic">
                    <SteelmanRedTeam
                      steelman={activeReport.steelman}
                      redTeam={activeReport.redTeam}
                    />
                  </div>
                )}

                {activeTab === 'receipts' && (
                  <div className="tab-pane-receipts">
                    <EvidenceReceipts receipts={activeReport.evidenceReceipts} />
                  </div>
                )}

                {activeTab === 'falsification' && (
                  <div className="tab-pane-falsification">
                    <FalsificationCard plan={activeReport.falsificationPlan} />
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="tab-pane-timeline">
                    <div className="timeline-recap-header">
                      <h3 className="pane-title">Live Research Audit Trail</h3>
                      <p className="pane-lead">Complete sequential record of autonomous queries dispatched by Contra AI.</p>
                    </div>
                    <LiveTimeline
                      timeline={activeReport.timeline && activeReport.timeline.length > 0 ? activeReport.timeline : liveTimeline}
                      activeStepIndex={activeReport.timeline && activeReport.timeline.length > 0 ? activeReport.timeline.length - 1 : 4}
                    />
                  </div>
                )}
              </div>

              {/* Dossier Bottom Action Bar */}
              <footer className="dossier-bottom-bar">
                <button
                  type="button"
                  className="dossier-new-btn"
                  onClick={handleNewInvestigation}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Challenge another hypothesis</span>
                </button>
              </footer>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
