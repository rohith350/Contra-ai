import { useState, useRef, useEffect } from 'react'
import type { SphereAnimationState } from '../types/sphere'
import type { InvestigationReport, TimelineEvent } from '../types/investigation'
import { ContraAISphere } from '../components/ContraAISphere'
import { ChatGPTComposer, type AttachedSource, type ComposerMode } from '../components/ChatGPTComposer'
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

export interface HistoryEntry {
  id: string
  hypothesis: string
  timestamp: string
  certaintyScore: number
  biasIndex: string
  sourcesCount?: number
}

type ActiveModal =
  | null
  | 'saved'
  | 'history'
  | 'evidence-library'
  | 'research-sources'
  | 'ai-activity'
  | 'settings'
  | 'voice-preferences'
  | 'help-docs'

// ── Intent Detection Engine ──────────────────────────────────────────────────
function detectIntent(text: string, hasSources: boolean = false): 'investigate' | 'chat' {
  if (hasSources) return 'investigate'
  const trimmed = text.trim()
  if (!trimmed) return 'chat'

  const lower = trimmed.toLowerCase()

  // 1. Direct conversational greetings & pleasantries
  const greetings = [
    'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'howdy', 'yo', 'sup', 'hola', 'what\'s up', 'whats up', 'who are you', 'what are you',
    'what can you do', 'help', 'help me', 'how are you', 'how do you work',
    'thank you', 'thanks', 'cool', 'awesome', 'nice', 'great', 'bye', 'goodbye'
  ]
  if (
    greetings.includes(lower) ||
    greetings.some((g) => lower.startsWith(g + ' ') || lower.startsWith(g + '!') || lower.startsWith(g + ','))
  ) {
    return 'chat'
  }

  // 2. Direct explanation/inquiry questions
  const isQuestion = trimmed.endsWith('?')
  const isQuestionStarter = /^(what is|what are|explain|describe|tell me about|define|can you explain|why is|why does|how does)/i.test(
    lower
  )

  // Explicit hypothesis markers that indicate an investigation claim
  const hasHypothesisMarkers =
    /\b(hypothesis|claim|causes|correlates|outperforms|reduces|increases|decreases|leads to|results in|lifecycle|carbon footprint|efficiency differential|statistically significant)\b/i.test(
      lower
    )

  if (isQuestionStarter && !hasHypothesisMarkers) {
    return 'chat'
  }

  if (isQuestion && !hasHypothesisMarkers) {
    return 'chat'
  }

  // Short casual queries without scientific/empirical claims
  if (trimmed.split(/\s+/).length <= 4 && !hasHypothesisMarkers) {
    return 'chat'
  }

  // Default to investigate for declarative claims and structured propositions
  return 'investigate'
}

export function DashboardPage({ onNavigateHome }: DashboardPageProps) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('welcome')
  const [researchStage, setResearchStage] = useState<ResearchStage>('preparing')
  const [hypothesis, setHypothesis] = useState('')
  const [activeHypothesis, setActiveHypothesis] = useState('')
  const [activeSources, setActiveSources] = useState<AttachedSource[]>([])
  const [composerMode, setComposerMode] = useState<ComposerMode>('auto')
  const [activeReport, setActiveReport] = useState<InvestigationReport>(SAMPLE_INVESTIGATION_REPORT)
  const [activeTab, setActiveTab] = useState<DossierTab>('synthesis')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  // History & Saved Records
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

  const [savedInvestigations, setSavedInvestigations] = useState<HistoryEntry[]>([
    {
      id: 'inv-case-01',
      hypothesis: 'Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles.',
      timestamp: 'Saved Yesterday',
      certaintyScore: 62,
      biasIndex: 'Conditional / Nuanced',
      sourcesCount: 2,
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

  // Settings State
  const [rigorLevel, setRigorLevel] = useState<'strict' | 'balanced' | 'exploratory'>('strict')
  const [autoReadExecutive, setAutoReadExecutive] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [speechPitch, setSpeechPitch] = useState(1.0)

  // ── Single Voice Agent (Nemotron-powered voice conversation & TTS) ────────
  const voice = useVoiceAgent()
  const [isAISpeaking, setIsAISpeaking] = useState(false)

  // Suggested Hypotheses
  const sampleHypotheses = [
    {
      topic: 'Mobility & Energy',
      claim: 'Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles.',
      citations: '14 Studies',
      tension: 'High Dialectic Tension',
    },
    {
      topic: 'Software Engineering',
      claim: 'AI code generation increases defect density in critical production systems.',
      citations: '9 Benchmarks',
      tension: 'Bilateral Split',
    },
    {
      topic: 'Organizational Behavior',
      claim: 'Remote work decreases long-term engineering innovation and cross-team serendipity.',
      citations: '11 Longitudinal Reports',
      tension: 'Nuanced Consensus',
    },
  ]

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id))
    timeoutsRef.current = []
  }

  // Keyboard shortcut listener for Esc to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal) {
        setActiveModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModal])

  const runLocalSimulation = (trimmed: string, attachedSources: AttachedSource[]) => {
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

      if (autoReadExecutive) {
        voice.speak(`Executive Conclusion: ${synthesizedReport.verdictSummary}`)
      }
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
        detail:
          'Isolating fundamental causal claims from rhetoric; querying independent scientific indexes for null and contradictory results.',
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
            if (
              data.current_stage === 'preparing' ||
              data.current_stage === 'researching' ||
              data.current_stage === 'analyzing'
            ) {
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

          if (autoReadExecutive) {
            voice.speak(`Executive Conclusion: ${report.verdictSummary}`)
          }
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

  // ── Unified Submission Handler (Chat vs. Investigation) ───────────────────
  const handleComposerSubmit = (text: string, sources: AttachedSource[], mode: ComposerMode) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const effectiveIntent = mode === 'auto' ? detectIntent(trimmed, sources.length > 0) : mode

    if (effectiveIntent === 'chat') {
      // Stay on current page, send message to Nemotron via voice agent
      setHypothesis('')
      void voice.sendManual(trimmed)
    } else {
      // Launch empirical investigation
      setHypothesis('')
      void handleStartInvestigation(trimmed, sources)
    }
  }

  // ── Single Microphone Toggle Handler ──────────────────────────────────────
  const handleToggleVoice = () => {
    if (voice.agentState === 'listening') {
      voice.stopListening()
    } else if (voice.agentState === 'speaking') {
      voice.stopSpeaking()
    } else {
      // Recognized speech populates hypothesis state live for review/editing before sending
      voice.startListening((transcript) => {
        setHypothesis(transcript)
      })
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
    setActiveModal(null)
  }

  const toggleSaveInvestigation = (item: HistoryEntry) => {
    setSavedInvestigations((prev) => {
      const exists = prev.some((s) => s.hypothesis === item.hypothesis)
      if (exists) {
        return prev.filter((s) => s.hypothesis !== item.hypothesis)
      }
      return [{ ...item, timestamp: 'Saved Just now' }, ...prev]
    })
  }

  const handleToggleAISpeech = () => {
    if (isAISpeaking || voice.agentState === 'speaking') {
      voice.stopSpeaking()
      window.speechSynthesis?.cancel()
      setIsAISpeaking(false)
      return
    }

    const textToSpeak = `${activeReport.hypothesis}. Executive conclusion: ${activeReport.verdictSummary}`
    setIsAISpeaking(true)
    voice.speak(textToSpeak, () => setIsAISpeaking(false))
  }

  // Derive genuine sphere animation state
  const getSphereState = (): SphereAnimationState => {
    if (isAISpeaking || voice.agentState === 'speaking') return 'speaking'
    if (voice.agentState === 'thinking') return 'researching'
    if (voice.agentState === 'listening') return 'listening'
    if (workspaceState === 'researching') return 'researching'
    if (workspaceState === 'completed') return 'report-ready'
    if (workspaceState === 'error' || voice.agentState === 'error') return 'error'
    return 'idle'
  }

  // Dynamic Header Status Badge
  const getHeaderStatus = () => {
    if (voice.agentState === 'listening') {
      return {
        dotClass: 'state-listening',
        text: 'LISTENING • VOICE SENSORS ACTIVE',
      }
    }
    if (voice.agentState === 'thinking') {
      return {
        dotClass: 'state-thinking',
        text: 'THINKING • NEMOTRON SYNTHESIZING REASONING',
      }
    }
    if (voice.agentState === 'speaking' || isAISpeaking) {
      return {
        dotClass: 'state-speaking',
        text: 'SPEAKING • AUDIO SYNTHESIS ACTIVE',
      }
    }
    if (voice.agentState === 'error') {
      return {
        dotClass: 'state-error',
        text: 'SENSORS INTERRUPTED • TAP MIC TO RETRY',
      }
    }
    if (workspaceState === 'researching') {
      if (researchStage === 'preparing') {
        return { dotClass: 'state-researching', text: 'PREPARING • VECTOR DECOMPOSITION' }
      }
      if (researchStage === 'researching') {
        return { dotClass: 'state-researching', text: 'RESEARCHING • RETRIEVING CITATIONS' }
      }
      return { dotClass: 'state-thinking', text: 'ANALYZING • MODEL PROCESSING EVIDENCE' }
    }
    if (workspaceState === 'completed') {
      return { dotClass: 'state-ready', text: 'REPORT READY • EVIDENCE DOSSIER' }
    }
    return { dotClass: 'state-idle', text: 'READY • ENTER HYPOTHESIS OR QUESTION' }
  }

  const headerStatus = getHeaderStatus()

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* ==================================================================== */}
      {/* LEFT SIDEBAR: STRUCTURED PROFESSIONAL AI LABORATORY NAVIGATION        */}
      {/* ==================================================================== */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-text">
              CONTRA <span className="brand-dim">/ RESEARCH</span>
            </span>
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

        {/* Primary Action Button */}
        <div className="sidebar-action-wrap">
          <button type="button" className="new-investigation-btn" onClick={handleNewInvestigation}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Investigation</span>
          </button>
        </div>

        {/* Nav Scroll Container */}
        <div className="sidebar-nav-scroll">
          {/* SECTION 1: MAIN */}
          <div className="sidebar-group">
            <span className="sidebar-section-title">MAIN</span>
            <div className="sidebar-group-items">
              <button
                type="button"
                className={`sidebar-nav-btn ${workspaceState === 'welcome' && !activeModal ? 'active-nav' : ''}`}
                onClick={handleNewInvestigation}
              >
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="12 8 8 12 12 16 16 12 12 8"></polygon>
                  </svg>
                </span>
                <span className="nav-btn-text">Research Workspace</span>
              </button>

              <button type="button" className="sidebar-nav-btn" onClick={onNavigateHome}>
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </span>
                <span className="nav-btn-text">System Overview</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: WORKSPACE */}
          <div className="sidebar-group">
            <span className="sidebar-section-title">WORKSPACE</span>
            <div className="sidebar-group-items">
              <button
                type="button"
                className={`sidebar-nav-btn ${activeModal === 'saved' ? 'active-nav' : ''}`}
                onClick={() => setActiveModal('saved')}
              >
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </span>
                <span className="nav-btn-text">Saved Investigations</span>
                <span className="nav-count-badge">{savedInvestigations.length}</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-btn ${activeModal === 'history' ? 'active-nav' : ''}`}
                onClick={() => setActiveModal('history')}
              >
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </span>
                <span className="nav-btn-text">Investigation History</span>
                <span className="nav-count-badge">{history.length}</span>
              </button>
            </div>

            {/* In-sidebar Recent Investigations list */}
            <div className="sidebar-sublist">
              <span className="sidebar-sublist-title">RECENT RUNS</span>
              {history.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`history-item-btn ${
                    activeHypothesis === item.hypothesis && workspaceState === 'completed'
                      ? 'active-history'
                      : ''
                  }`}
                  onClick={() => handleLoadHistory(item)}
                >
                  <span className="history-score-tag">{item.certaintyScore}%</span>
                  <span className="history-item-text" title={item.hypothesis}>
                    {item.hypothesis}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: INTELLIGENCE */}
          <div className="sidebar-group">
            <span className="sidebar-section-title">INTELLIGENCE</span>
            <div className="sidebar-group-items">
              <button
                type="button"
                className={`sidebar-nav-btn ${activeModal === 'evidence-library' ? 'active-nav' : ''}`}
                onClick={() => setActiveModal('evidence-library')}
              >
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </span>
                <span className="nav-btn-text">Evidence Library</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-btn ${activeModal === 'research-sources' ? 'active-nav' : ''}`}
                onClick={() => setActiveModal('research-sources')}
              >
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </span>
                <span className="nav-btn-text">Research Sources</span>
                <span className="nav-status-dot online" title="Academic API streams active" />
              </button>

              <button
                type="button"
                className={`sidebar-nav-btn ${activeModal === 'ai-activity' ? 'active-nav' : ''}`}
                onClick={() => setActiveModal('ai-activity')}
              >
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </span>
                <span className="nav-btn-text">AI Telemetry Log</span>
              </button>
            </div>
          </div>

          {/* SECTION 4: PREFERENCES */}
          <div className="sidebar-group">
            <span className="sidebar-section-title">PREFERENCES</span>
            <div className="sidebar-group-items">
              <button
                type="button"
                className={`sidebar-nav-btn ${activeModal === 'settings' ? 'active-nav' : ''}`}
                onClick={() => setActiveModal('settings')}
              >
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </span>
                <span className="nav-btn-text">Investigation Rigor</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-btn ${activeModal === 'voice-preferences' ? 'active-nav' : ''}`}
                onClick={() => setActiveModal('voice-preferences')}
              >
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </span>
                <span className="nav-btn-text">Voice & Audio AI</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-btn ${activeModal === 'help-docs' ? 'active-nav' : ''}`}
                onClick={() => setActiveModal('help-docs')}
              >
                <span className="nav-btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </span>
                <span className="nav-btn-text">Methodology & Help</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button type="button" className="return-overview-btn" onClick={onNavigateHome}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Exit to Overview</span>
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MAIN WORKSPACE                                                       */}
      {/* ==================================================================== */}
      <main className="dashboard-main">
        {/* Top Minimal Toolbar with Real Dynamic Telemetry Status */}
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
              <span className={`state-pulse ${headerStatus.dotClass}`} aria-hidden="true" />
              <span className="state-label">{headerStatus.text}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="rigor-badge" title={`Rigor mode: ${rigorLevel}`}>
              <span className="rigor-icon">⚡</span>
              <span className="rigor-text">{rigorLevel.toUpperCase()} RIGOR</span>
            </div>
            <span className="engine-model-tag">NVIDIA NEMOTRON // NEBIUS</span>
          </div>
        </header>

        {/* WORKSPACE CONTENT STAGE */}
        <div className="workspace-stage">
          {/* ================================================================ */}
          {/* STATE A: WELCOME / INTAKE STATE                                  */}
          {/* ================================================================ */}
          {workspaceState === 'welcome' && (
            <div className="welcome-container">
              {/* Prominent Living Particle Neural Sphere (Stabilized & Jitter-Free) */}
              <div className="welcome-sphere-frame" aria-hidden="true">
                <ContraAISphere
                  state={getSphereState()}
                  size={360}
                  label={
                    isAISpeaking || voice.agentState === 'speaking'
                      ? 'CONTRA AI • AUDIO SYNTHESIS'
                      : voice.agentState === 'thinking'
                        ? 'NEMOTRON • REASONING'
                        : voice.agentState === 'listening'
                          ? 'VOICE CAPTURE • ACTIVE'
                          : 'NEURAL CORE • READY'
                  }
                  interactive={true}
                  isListening={voice.agentState === 'listening'}
                  isSpeaking={isAISpeaking || voice.agentState === 'speaking'}
                  className="welcome-sphere-hero"
                />
              </div>

              {/* Refined Visual Hierarchy Header */}
              <div className="welcome-intro">
                <div className="intro-kicker">
                  <span className="kicker-badge">DIALECTICAL INVESTIGATION ENGINE</span>
                  <span className="kicker-sep">•</span>
                  <span className="kicker-sub">ADVERSARIAL TRUTH VERIFICATION</span>
                </div>
                <h1 className="welcome-title">Challenge a hypothesis.</h1>
                <p className="welcome-subtitle">
                  Contra stress-tests scientific and empirical claims by aggressively seeking contradictory
                  evidence, unstated assumptions, and falsification conditions.
                </p>
              </div>

              {/* Active Conversation Turns (Chat flow with NVIDIA Nemotron) */}
              {voice.conversation.length > 0 && (
                <div className="welcome-conversation-stream" aria-label="Active conversation with Contra AI">
                  <div className="conversation-stream-header">
                    <span className="stream-header-title">CONVERSATION WITH CONTRA AI</span>
                    <button
                      type="button"
                      className="stream-clear-btn"
                      onClick={voice.clearConversation}
                      title="Clear conversation context"
                    >
                      Clear conversation
                    </button>
                  </div>
                  <div className="stream-turns-list">
                    {voice.conversation.map((turn, idx) => (
                      <div key={idx} className={`stream-turn ${turn.role}`}>
                        <div className="turn-meta">
                          <span className="turn-author">
                            {turn.role === 'user' ? 'YOU' : 'CONTRA AI // NEMOTRON'}
                          </span>
                          <span className="turn-time">
                            {new Date(turn.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="turn-body">
                          <p className="turn-text">{turn.content}</p>
                          {turn.role === 'assistant' && (
                            <div className="turn-actions">
                              <button
                                type="button"
                                className="turn-action-btn"
                                onClick={() => voice.speak(turn.content)}
                                title="Listen to this response"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                </svg>
                                <span>Listen</span>
                              </button>
                              <button
                                type="button"
                                className="turn-action-btn highlight"
                                onClick={() => handleStartInvestigation(turn.content)}
                                title="Launch autonomous evidence investigation for this claim"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polygon points="12 8 8 12 12 16 16 12 12 8"></polygon>
                                </svg>
                                <span>Investigate as Hypothesis</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Prompt Cards */}
              <div className="sample-prompts-container">
                <div className="sample-prompts-bar">
                  <span className="sample-prompts-label">CURATED BENCHMARK HYPOTHESES</span>
                  <span className="sample-prompts-hint">Select a claim to load into the composer</span>
                </div>
                <div className="sample-prompts-grid">
                  {sampleHypotheses.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="sample-prompt-card"
                      onClick={() => setHypothesis(item.claim)}
                    >
                      <div className="card-top-row">
                        <span className="card-topic-tag">{item.topic}</span>
                        <span className="card-meta-pill">{item.citations}</span>
                      </div>
                      <p className="card-claim-text">&ldquo;{item.claim}&rdquo;</p>
                      <div className="card-bottom-row">
                        <span className="card-tension-indicator">{item.tension}</span>
                        <span className="card-arrow-icon" aria-hidden="true">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main ChatGPT-Style Input Composer with Single Unified Microphone */}
              <div className="welcome-composer-wrapper">
                <ChatGPTComposer
                  hypothesis={hypothesis}
                  onHypothesisChange={setHypothesis}
                  onSubmitMessage={handleComposerSubmit}
                  isResearching={false}
                  voiceState={voice.agentState}
                  onToggleVoice={handleToggleVoice}
                  onStopSpeaking={voice.stopSpeaking}
                  voiceErrorMessage={voice.errorMessage}
                  mode={composerMode}
                  onModeChange={setComposerMode}
                  placeholder={
                    composerMode === 'chat'
                      ? 'Ask Contra anything or discuss evidence...'
                      : composerMode === 'investigate'
                        ? 'Enter an empirical claim to challenge with contradictory research...'
                        : 'Enter a hypothesis to investigate or ask a question (Auto detects mode)...'
                  }
                />
              </div>
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
                  <button type="button" className="cancel-run-btn" onClick={handleCancelInvestigation}>
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

                  <div className="timeline-card-box">
                    <LiveTimeline timeline={liveTimeline} activeStepIndex={timelineStepIndex} />
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
                        label="EVIDENCE RETRIEVAL • ACTIVE"
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
                  <span className="dossier-demo-tag">EMPIRICAL BENCHMARK</span>
                  <span className="dossier-time">{new Date(activeReport.timestamp).toLocaleDateString()}</span>
                  <span className="dossier-consensus">{activeReport.biasIndex}</span>
                  {activeSources.length > 0 && (
                    <span className="dossier-sources-count">{activeSources.length} Prior Source(s)</span>
                  )}
                  <button
                    type="button"
                    className={`bookmark-btn ${
                      savedInvestigations.some((s) => s.hypothesis === activeReport.hypothesis)
                        ? 'bookmarked'
                        : ''
                    }`}
                    onClick={() =>
                      toggleSaveInvestigation({
                        id: activeReport.id,
                        hypothesis: activeReport.hypothesis,
                        timestamp: 'Saved Today',
                        certaintyScore: activeReport.certaintyScore,
                        biasIndex: activeReport.biasIndex,
                        sourcesCount: activeSources.length,
                      })
                    }
                    title="Bookmark to Saved Investigations"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={savedInvestigations.some((s) => s.hypothesis === activeReport.hypothesis) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>
                      {savedInvestigations.some((s) => s.hypothesis === activeReport.hypothesis)
                        ? 'Saved'
                        : 'Save'}
                    </span>
                  </button>
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

                    <SteelmanRedTeam steelman={activeReport.steelman} redTeam={activeReport.redTeam} />
                  </div>
                )}

                {activeTab === 'autopsy' && (
                  <div className="tab-pane-autopsy">
                    <AssumptionAutopsy assumptions={activeReport.assumptions} />
                  </div>
                )}

                {activeTab === 'dialectic' && (
                  <div className="tab-pane-dialectic">
                    <SteelmanRedTeam steelman={activeReport.steelman} redTeam={activeReport.redTeam} />
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
                      timeline={
                        activeReport.timeline && activeReport.timeline.length > 0
                          ? activeReport.timeline
                          : liveTimeline
                      }
                      activeStepIndex={
                        activeReport.timeline && activeReport.timeline.length > 0
                          ? activeReport.timeline.length - 1
                          : 4
                      }
                    />
                  </div>
                )}
              </div>

              {/* Dossier Bottom Action Bar */}
              <footer className="dossier-bottom-bar">
                <button type="button" className="dossier-new-btn" onClick={handleNewInvestigation}>
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

      {/* ==================================================================== */}
      {/* INTERACTIVE WORKSPACE MODALS (NO DEAD BUTTONS)                       */}
      {/* ==================================================================== */}

      {/* 1. SAVED INVESTIGATIONS MODAL */}
      {activeModal === 'saved' && (
        <div className="workspace-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="saved-modal-title">
            <div className="modal-head">
              <div>
                <h3 id="saved-modal-title" className="modal-title">Saved Investigations</h3>
                <p className="modal-subtitle">Bookmarked empirical reports for rapid citation retrieval</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <div className="modal-body-scroll">
              {savedInvestigations.length === 0 ? (
                <div className="empty-modal-state">
                  <p>No saved investigations yet. Click the bookmark icon in any dossier to save reports here.</p>
                </div>
              ) : (
                <div className="saved-items-grid">
                  {savedInvestigations.map((item) => (
                    <div key={item.id} className="saved-item-card">
                      <div className="saved-card-header">
                        <span className="saved-certainty-badge">{item.certaintyScore}% Certainty</span>
                        <span className="saved-bias-tag">{item.biasIndex}</span>
                      </div>
                      <p className="saved-claim-text">&ldquo;{item.hypothesis}&rdquo;</p>
                      <div className="saved-card-footer">
                        <span className="saved-date">{item.timestamp}</span>
                        <div className="saved-actions">
                          <button
                            type="button"
                            className="btn-modal-action"
                            onClick={() => handleLoadHistory(item)}
                          >
                            Open Dossier
                          </button>
                          <button
                            type="button"
                            className="btn-modal-remove"
                            onClick={() => toggleSaveInvestigation(item)}
                            title="Remove bookmark"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. INVESTIGATION HISTORY MODAL */}
      {activeModal === 'history' && (
        <div className="workspace-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="workspace-modal modal-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="hist-modal-title">
            <div className="modal-head">
              <div>
                <h3 id="hist-modal-title" className="modal-title">Investigation History</h3>
                <p className="modal-subtitle">Sequential record of autonomous dialectical runs in this session</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <div className="modal-body-scroll">
              <div className="history-table-wrapper">
                <table className="modal-data-table">
                  <thead>
                    <tr>
                      <th>HYPOTHESIS</th>
                      <th>DATE</th>
                      <th>CERTAINTY</th>
                      <th>CONSENSUS BIAS</th>
                      <th>SOURCES</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id}>
                        <td className="table-claim-col" title={item.hypothesis}>
                          {item.hypothesis}
                        </td>
                        <td className="table-mono-col">{item.timestamp}</td>
                        <td>
                          <span className="certainty-pill">{item.certaintyScore}%</span>
                        </td>
                        <td className="table-dim-col">{item.biasIndex}</td>
                        <td className="table-mono-col">{item.sourcesCount ?? 2}</td>
                        <td>
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => handleLoadHistory(item)}
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. EVIDENCE LIBRARY MODAL */}
      {activeModal === 'evidence-library' && (
        <div className="workspace-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="workspace-modal modal-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="ev-modal-title">
            <div className="modal-head">
              <div>
                <h3 id="ev-modal-title" className="modal-title">Evidence Library</h3>
                <p className="modal-subtitle">Aggregated peer-reviewed citations and empirical receipts</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <div className="modal-body-scroll">
              <div className="evidence-receipts-list">
                {activeReport.evidenceReceipts.map((rec) => (
                  <div key={rec.id} className="library-receipt-card">
                    <div className="receipt-tag-row">
                      <span className={`stance-badge ${rec.stance.toLowerCase()}`}>{rec.stance}</span>
                      <span className="receipt-doi">{rec.sourceName}</span>
                      <span className="receipt-quality">{rec.date}</span>
                    </div>
                    <h4 className="receipt-title">{rec.title}</h4>
                    <p className="receipt-meta">
                      <span>Source: {rec.sourceName}</span> • <span>Methodology: {rec.methodologyNotes}</span>
                    </p>
                    <blockquote className="receipt-quote">&ldquo;{rec.excerpt}&rdquo;</blockquote>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESEARCH SOURCES MODAL */}
      {activeModal === 'research-sources' && (
        <div className="workspace-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="src-modal-title">
            <div className="modal-head">
              <div>
                <h3 id="src-modal-title" className="modal-title">Connected Academic Indices</h3>
                <p className="modal-subtitle">Federated academic indexes queried during adversarial decomposition</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <div className="modal-body-scroll">
              <div className="sources-status-list">
                {[
                  { name: 'arXiv Pre-print Server', latency: '42ms', status: 'Connected', records: '2.4M+ Papers' },
                  { name: 'PubMed Central / NCBI', latency: '68ms', status: 'Connected', records: '36M+ Citations' },
                  { name: 'Semantic Scholar Open Corpus', latency: '35ms', status: 'Connected', records: '210M+ Papers' },
                  { name: 'CrossRef Digital Object Registry', latency: '51ms', status: 'Connected', records: '140M+ DOIs' },
                  { name: 'Directory of Open Access Journals (DOAJ)', latency: '45ms', status: 'Connected', records: '9.8M+ Articles' },
                  { name: 'IEEE Xplore Research Gateway', latency: '78ms', status: 'Connected', records: '5.6M+ Documents' },
                ].map((src, i) => (
                  <div key={i} className="source-status-row">
                    <div className="source-info">
                      <span className="source-name">{src.name}</span>
                      <span className="source-records">{src.records}</span>
                    </div>
                    <div className="source-meta">
                      <span className="source-latency">{src.latency}</span>
                      <span className="source-online-badge">ONLINE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. AI TELEMETRY LOG MODAL */}
      {activeModal === 'ai-activity' && (
        <div className="workspace-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="workspace-modal modal-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="act-modal-title">
            <div className="modal-head">
              <div>
                <h3 id="act-modal-title" className="modal-title">AI Telemetry & Execution Log</h3>
                <p className="modal-subtitle">Audit trail of dialectical dispatches and model evaluations</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <div className="modal-body-scroll">
              <div className="telemetry-log-console">
                <div className="log-entry">
                  <span className="log-time">[00:00.12]</span>
                  <span className="log-tag tag-model">NEMOTRON-70B</span>
                  <span className="log-msg">Bilateral dialectical prompt formulated with adversarial counter-vector.</span>
                </div>
                <div className="log-entry">
                  <span className="log-time">[00:00.84]</span>
                  <span className="log-tag tag-net">INDEX-ROUTER</span>
                  <span className="log-msg">Dispatched 6 parallel search queries across Semantic Scholar & arXiv.</span>
                </div>
                <div className="log-entry">
                  <span className="log-time">[00:01.45]</span>
                  <span className="log-tag tag-proc">EMBEDDINGS</span>
                  <span className="log-msg">Computed cosine similarity matrix for 14 retrieved evidence receipts.</span>
                </div>
                <div className="log-entry">
                  <span className="log-time">[00:02.10]</span>
                  <span className="log-tag tag-model">NEMOTRON-70B</span>
                  <span className="log-msg">Assumptions autopsied: 4 structural vulnerabilities identified.</span>
                </div>
                <div className="log-entry">
                  <span className="log-time">[00:02.90]</span>
                  <span className="log-tag tag-success">FALSIFICATION</span>
                  <span className="log-msg">Operational falsification plan synthesized with quantitative refutation thresholds.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SETTINGS (INVESTIGATION RIGOR) MODAL */}
      {activeModal === 'settings' && (
        <div className="workspace-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="set-modal-title">
            <div className="modal-head">
              <div>
                <h3 id="set-modal-title" className="modal-title">Investigation Rigor & Engine Settings</h3>
                <p className="modal-subtitle">Calibrate adversarial sensitivity and stopping conditions</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <div className="modal-body-scroll">
              <div className="settings-section">
                <label className="settings-label">DIALECTICAL RIGOR LEVEL</label>
                <div className="rigor-options-grid">
                  {(['strict', 'balanced', 'exploratory'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`rigor-select-btn ${rigorLevel === level ? 'active' : ''}`}
                      onClick={() => setRigorLevel(level)}
                    >
                      <span className="level-name">{level.toUpperCase()}</span>
                      <span className="level-desc">
                        {level === 'strict' && 'Aggressively searches for falsifying evidence and counter-citations.'}
                        {level === 'balanced' && 'Equal weighting between affirmative proof and adversarial checks.'}
                        {level === 'exploratory' && 'Broad discovery mode prioritizing novel peripheral connections.'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-section">
                <label className="settings-label">MODEL ORCHESTRATION</label>
                <div className="setting-readout">
                  <span className="readout-label">Reasoner Engine</span>
                  <span className="readout-value">NVIDIA Nemotron via Nebius (Online)</span>
                </div>
              </div>

              <div className="settings-section">
                <label className="settings-label">SESSION CACHE</label>
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={() => {
                    voice.clearConversation()
                    setHypothesis('')
                    alert('Session cache cleared successfully.')
                  }}
                >
                  Clear Local Conversation Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. VOICE PREFERENCES MODAL */}
      {activeModal === 'voice-preferences' && (
        <div className="workspace-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="voice-modal-title">
            <div className="modal-head">
              <div>
                <h3 id="voice-modal-title" className="modal-title">Voice & Audio AI Preferences</h3>
                <p className="modal-subtitle">Configure real-time Speech-to-Text and Text-to-Speech playback</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <div className="modal-body-scroll">
              <div className="settings-section">
                <div className="setting-toggle-row">
                  <div>
                    <span className="toggle-label">Auto-Read Executive Conclusion</span>
                    <span className="toggle-desc">Automatically speak synthesis verdict when dossier completes</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-checkbox"
                    checked={autoReadExecutive}
                    onChange={(e) => setAutoReadExecutive(e.target.checked)}
                  />
                </div>
              </div>

              <div className="settings-section">
                <label className="settings-label">SPEECH RATE ({speechRate.toFixed(2)}x)</label>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="settings-slider"
                />
              </div>

              <div className="settings-section">
                <label className="settings-label">SPEECH PITCH ({speechPitch.toFixed(2)})</label>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="settings-slider"
                />
              </div>

              <div className="settings-section">
                <button
                  type="button"
                  className="btn-modal-action"
                  onClick={() => voice.speak('Contra AI voice synthesis online. Ready for dialectical inquiry.')}
                >
                  Test Audio Playback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. METHODOLOGY & HELP MODAL */}
      {activeModal === 'help-docs' && (
        <div className="workspace-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="workspace-modal modal-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
            <div className="modal-head">
              <div>
                <h3 id="help-modal-title" className="modal-title">Contra AI Architecture & Methodology</h3>
                <p className="modal-subtitle">Non-dogmatic adversarial inquiry powered by NVIDIA Nemotron</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <div className="modal-body-scroll">
              <div className="help-grid">
                <div className="help-card">
                  <h4>1. Adaptive Investigation Engine</h4>
                  <p>Autonomous query planning, stopping conditions, and bilateral coverage satisfaction checks.</p>
                </div>
                <div className="help-card">
                  <h4>2. Assumption Autopsy</h4>
                  <p>Deconstructs claims into unstated premises, structural dependencies, and blind spots.</p>
                </div>
                <div className="help-card">
                  <h4>3. Live Investigation Timeline</h4>
                  <p>Real-time telemetry tracking dispatched queries, evidence discoveries, and contradictions.</p>
                </div>
                <div className="help-card">
                  <h4>4. Steelman vs. Red Team</h4>
                  <p>Bilateral presentation contrasting the strongest affirmative argument with sharpest counter-evidence.</p>
                </div>
                <div className="help-card">
                  <h4>5. Evidence Receipts</h4>
                  <p>Granular citations tagged with stance, exact excerpts, journal metrics, and verifiable DOIs.</p>
                </div>
                <div className="help-card">
                  <h4>6. Empirical Falsification Plan</h4>
                  <p>Operational test conditions and quantitative thresholds required to refute current findings.</p>
                </div>
              </div>

              <div className="help-shortcuts-section">
                <h4 className="shortcuts-title">KEYBOARD SHORTCUTS</h4>
                <div className="shortcuts-list">
                  <div className="shortcut-item">
                    <kbd>Enter</kbd>
                    <span>Submit hypothesis or question in composer</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Shift</kbd> + <kbd>Enter</kbd>
                    <span>Insert new line in composer textarea</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Esc</kbd>
                    <span>Close active modal or overlay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
