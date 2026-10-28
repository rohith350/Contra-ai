"""
Validated Pydantic models and schemas for Contra AI.
Matches frontend contract defined in src/types/investigation.ts and API endpoints.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class InvestigationStatus(str, Enum):
    QUEUED = "queued"
    RESEARCHING = "researching"
    COMPLETED = "completed"
    FAILED = "failed"
    INCONCLUSIVE = "inconclusive"


class AssumptionStatus(str, Enum):
    SUPPORTED = "supported"
    CONTRADICTED = "contradicted"
    UNRESOLVED = "unresolved"


class TimelineEventType(str, Enum):
    SEARCH = "search"
    DISCOVERY = "discovery"
    CONTRADICTION = "contradiction"
    GAP = "gap"
    DECISION = "decision"


class StanceType(str, Enum):
    SUPPORTING = "supporting"
    CONTRADICTING = "contradicting"
    NEUTRAL = "neutral"


# ==============================================================================
# Frontend-Compatible Core Report Schemas
# ==============================================================================

class AssumptionItem(BaseModel):
    id: str = Field(description="Unique identifier for the assumption")
    premise: str = Field(description="The underlying premise or decomposed claim")
    status: AssumptionStatus = Field(description="Empirical verdict on this assumption")
    vulnerability: str = Field(description="Structural vulnerability or verified consensus")
    coveragePercent: int = Field(ge=0, le=100, description="Evidence coverage percentage")


class TimelineEvent(BaseModel):
    id: str = Field(description="Unique event ID")
    timeOffset: str = Field(description="Elapsed time string (e.g. '1.4s')")
    type: TimelineEventType = Field(description="Category of the telemetry event")
    headline: str = Field(description="Concise event headline")
    detail: str = Field(description="Detailed description of the finding or action")
    query: Optional[str] = Field(default=None, description="Dispatched search query if applicable")
    source: Optional[str] = Field(default=None, description="Identified source or engine")


class EvidenceReceipt(BaseModel):
    id: str = Field(description="Unique citation identifier")
    title: str = Field(description="Title of the source publication or article")
    sourceName: str = Field(description="Domain or institutional author")
    url: str = Field(description="Verified URL of the citation")
    date: str = Field(description="Publication date or retrieved date")
    stance: StanceType = Field(description="Verified stance relative to the hypothesis")
    excerpt: str = Field(description="Direct verbatim or key factual excerpt")
    methodologyNotes: str = Field(description="Study design or analytical methodology")
    limitations: str = Field(description="Known caveats, population bounds, or scope limits")


class DialecticalCase(BaseModel):
    title: str = Field(description="Title of dialectical case")
    coreArgument: str = Field(description="Core thesis of the affirmative or counter position")
    keyFindings: List[str] = Field(description="Key supporting or contradicting findings")
    primarySources: List[str] = Field(description="Primary author or organizational references")


class FalsificationPlan(BaseModel):
    testProcedure: str = Field(description="Concrete empirical test conditions")
    measurableMetric: str = Field(description="Quantitative variable or metric to observe")
    falsificationThreshold: str = Field(description="Exact condition under which hypothesis is refuted")
    counterEvidenceRequired: str = Field(description="Specific evidence required to overturn verdict")


class InvestigationReport(BaseModel):
    id: str = Field(description="Unique dossier identifier")
    hypothesis: str = Field(description="User-submitted proposition or claim")
    timestamp: str = Field(description="ISO-8601 creation timestamp")
    verdictSummary: str = Field(description="Balanced executive verdict synthesized by Nemotron")
    certaintyScore: int = Field(ge=0, le=100, description="Calibrated confidence level")
    biasIndex: str = Field(description="Bias classification (e.g. 'High Empirical Consensus')")
    stoppingRationale: str = Field(description="Transparent criteria for concluding the investigation")
    assumptions: List[AssumptionItem] = Field(default_factory=list)
    timeline: List[TimelineEvent] = Field(default_factory=list)
    steelman: DialecticalCase
    redTeam: DialecticalCase
    evidenceReceipts: List[EvidenceReceipt] = Field(default_factory=list)
    falsificationPlan: FalsificationPlan
    is_mock: bool = Field(default=False, description="Flag indicating mock mode inference")


# ==============================================================================
# API Request & Response Contracts
# ==============================================================================

class AttachedSourceInput(BaseModel):
    id: str
    name: str
    size: Optional[int] = None
    type: Optional[str] = None


class InvestigationCreateRequest(BaseModel):
    hypothesis: str = Field(
        min_length=5,
        max_length=500,
        description="The hypothesis or claim to test and challenge",
    )
    attached_sources: List[AttachedSourceInput] = Field(
        default_factory=list,
        description="Optional list of user-attached reference documents or notes",
    )


class InvestigationCreateResponse(BaseModel):
    id: str
    status: InvestigationStatus
    message: str


class InvestigationStatusResponse(BaseModel):
    id: str
    hypothesis: str
    status: InvestigationStatus
    progress_percent: int = Field(ge=0, le=100)
    current_stage: str
    current_query: Optional[str] = None
    claims_decomposed: List[str] = Field(default_factory=list)
    timeline_events_count: int = 0
    created_at: str
    updated_at: str
    error_message: Optional[str] = None
    is_mock: bool = False


# ==============================================================================
# Intermediate Reasoning Models for Nemotron Structured Prompts
# ==============================================================================

class DecomposedClaim(BaseModel):
    id: str
    claim_text: str
    adversarial_angle: str
    testable_metric: str


class ClaimDecompositionOutput(BaseModel):
    claims: List[DecomposedClaim] = Field(
        min_length=3,
        max_length=5,
        description="3 to 5 decomposed testable sub-claims",
    )


class SearchQueryItem(BaseModel):
    claim_id: str
    query: str
    intent: str  # e.g., "disprove_initial_debt", "test_null_hypothesis"


class QueryPlanOutput(BaseModel):
    queries: List[SearchQueryItem]


class EvidenceEvaluationItem(BaseModel):
    source_url: str
    source_name: str
    source_title: str
    claim_id: str
    stance: StanceType
    factual_basis: str  # Distinction between factual contradiction vs mere opinion
    excerpt: str
    methodology: str
    caveats_or_limitations: str
    is_genuine_contradiction: bool


class EvidenceExtractionOutput(BaseModel):
    evaluations: List[EvidenceEvaluationItem] = Field(default_factory=list)
    unresolved_gaps: List[str] = Field(default_factory=list)


class FollowUpPlanOutput(BaseModel):
    needs_followup: bool
    followup_query: Optional[str] = None
    gap_reasoning: Optional[str] = None
