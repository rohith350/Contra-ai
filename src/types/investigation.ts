export interface AssumptionItem {
  id: string
  premise: string
  status: 'supported' | 'contradicted' | 'unresolved'
  vulnerability: string
  coveragePercent: number
}

export interface TimelineEvent {
  id: string
  timeOffset: string
  type: 'search' | 'discovery' | 'contradiction' | 'gap' | 'decision'
  query?: string
  headline: string
  detail: string
  source?: string
}

export interface EvidenceReceipt {
  id: string
  title: string
  sourceName: string
  url: string
  date: string
  stance: 'supporting' | 'contradicting' | 'neutral'
  excerpt: string
  methodologyNotes: string
  limitations: string
}

export interface DialecticalCase {
  title: string
  coreArgument: string
  keyFindings: string[]
  primarySources: string[]
}

export interface FalsificationPlan {
  testProcedure: string
  measurableMetric: string
  falsificationThreshold: string
  counterEvidenceRequired: string
}

export interface InvestigationReport {
  id: string
  hypothesis: string
  timestamp: string
  verdictSummary: string
  certaintyScore: number
  biasIndex: string // e.g. "Low Confirmation Bias Risk"
  assumptions: AssumptionItem[]
  timeline: TimelineEvent[]
  steelman: DialecticalCase
  redTeam: DialecticalCase
  evidenceReceipts: EvidenceReceipt[]
  falsificationPlan: FalsificationPlan
  stoppingRationale: string
}
