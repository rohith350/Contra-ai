"""
Contra Autonomous Contradiction Discovery Research Agent.
Orchestrates claim decomposition, adversarial retrieval, evidence extraction,
factual verification, gap analysis with autonomous follow-up, and balanced report synthesis.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import logging
import time
from typing import List, Optional

from backend.config import settings
from backend.models.schemas import (
    AssumptionItem,
    AssumptionStatus,
    ClaimDecompositionOutput,
    DecomposedClaim,
    DialecticalCase,
    EvidenceEvaluationItem,
    EvidenceExtractionOutput,
    EvidenceReceipt,
    FalsificationPlan,
    FollowUpPlanOutput,
    InvestigationReport,
    InvestigationStatus,
    QueryPlanOutput,
    SearchQueryItem,
    StanceType,
    TimelineEvent,
    TimelineEventType,
)
from backend.services.nemotron_service import (
    MissingCredentialsError,
    NemotronAPIError,
    QuotaExceededError,
    nemotron_service,
)
from backend.services.search_service import search_service
from backend.services.storage_service import storage_service

logger = logging.getLogger(__name__)


class AgentService:
    async def run_investigation(
        self,
        investigation_id: str,
        hypothesis: str,
        attached_sources: Optional[list] = None,
    ):
        """
        Executes the end-to-end contradiction investigation pipeline.
        Publishes timeline telemetry and saves final report.
        """
        start_time = time.time()
        nemotron_service.reset_call_counter()
        search_service.reset_counter()

        def elapsed_str() -> str:
            return f"{round(time.time() - start_time, 1)}s"

        try:
            logger.info("Starting investigation %s for hypothesis: %s", investigation_id, hypothesis)
            is_mock_run = settings.effective_mock_mode

            # Stage 1: Preparation & Decomposition (0% -> 25%)
            storage_service.update_progress(
                investigation_id=investigation_id,
                progress_percent=10,
                stage="preparing",
                current_query=f"Analyzing claim: {hypothesis[:60]}...",
            )

            storage_service.append_timeline_event(
                investigation_id,
                TimelineEvent(
                    id=f"t-{investigation_id}-1",
                    timeOffset=elapsed_str(),
                    type=TimelineEventType.SEARCH,
                    headline="Dialectical Decomposition Initiated",
                    detail="Deconstructing proposition into 3–5 testable empirical sub-claims and structural premises.",
                    query=f"Premise decomposition: {hypothesis[:50]}",
                    source="NVIDIA Nemotron Reasoner",
                ),
            )

            decomposed = await self._decompose_hypothesis(hypothesis, is_mock=is_mock_run)
            decomposed_texts = [c.claim_text for c in decomposed.claims]

            storage_service.update_progress(
                investigation_id=investigation_id,
                progress_percent=25,
                stage="preparing",
                claims_decomposed=decomposed_texts,
            )

            # Stage 2: Adversarial Query Planning & Search (25% -> 55%)
            storage_service.update_progress(
                investigation_id=investigation_id,
                progress_percent=35,
                stage="researching",
                current_query="Formulating adversarial disconfirmation vectors...",
            )

            query_plan = await self._generate_search_plan(hypothesis, decomposed.claims, is_mock=is_mock_run)

            # Execute searches and collect real results
            raw_evidence_list: List[dict] = []
            queries_dispatched = 0

            for q_item in query_plan.queries[: settings.max_search_queries]:
                queries_dispatched += 1
                storage_service.update_progress(
                    investigation_id=investigation_id,
                    progress_percent=min(55, 35 + (queries_dispatched * 5)),
                    stage="researching",
                    current_query=q_item.query,
                )

                storage_service.append_timeline_event(
                    investigation_id,
                    TimelineEvent(
                        id=f"t-{investigation_id}-q{queries_dispatched}",
                        timeOffset=elapsed_str(),
                        type=TimelineEventType.SEARCH,
                        headline=f"Adversarial Query Vector #{queries_dispatched}",
                        detail=f"Testing intent '{q_item.intent}' across scientific repositories and empirical datasets.",
                        query=q_item.query,
                        source="Web Retrieval Engine",
                    ),
                )

                results = await search_service.search(q_item.query) if not is_mock_run else []
                for r in results:
                    raw_evidence_list.append(
                        {
                            "claim_id": q_item.claim_id,
                            "query": q_item.query,
                            "title": r.title,
                            "snippet": r.snippet,
                            "url": r.url,
                            "source_name": r.source_name,
                        }
                    )
                # Brief yield to keep async responsive
                await asyncio.sleep(0.05 if not is_mock_run else 0.2)

            # Stage 3: Evidence Extraction & Verification (55% -> 75%)
            storage_service.update_progress(
                investigation_id=investigation_id,
                progress_percent=60,
                stage="analyzing",
                current_query="Cross-examining empirical claims against retrieved citations...",
            )

            extraction = await self._extract_and_verify_evidence(
                hypothesis, decomposed.claims, raw_evidence_list, is_mock=is_mock_run
            )

            # Emit timeline events for verified contradictions and discoveries
            contradictions_found = [e for e in extraction.evaluations if e.stance == StanceType.CONTRADICTING and e.is_genuine_contradiction]
            supporting_found = [e for e in extraction.evaluations if e.stance == StanceType.SUPPORTING]

            if supporting_found:
                first_sup = supporting_found[0]
                storage_service.append_timeline_event(
                    investigation_id,
                    TimelineEvent(
                        id=f"t-{investigation_id}-disc",
                        timeOffset=elapsed_str(),
                        type=TimelineEventType.DISCOVERY,
                        headline="Supporting Evidence Surface Verified",
                        detail=f"Identified corroborating data: {first_sup.excerpt[:120]}...",
                        source=first_sup.source_name,
                    ),
                )

            if contradictions_found:
                first_contra = contradictions_found[0]
                storage_service.append_timeline_event(
                    investigation_id,
                    TimelineEvent(
                        id=f"t-{investigation_id}-contra",
                        timeOffset=elapsed_str(),
                        type=TimelineEventType.CONTRADICTION,
                        headline="Empirical Contradiction Discovered",
                        detail=f"Distinguished genuine factual divergence: {first_contra.factual_basis[:120]}...",
                        source=first_contra.source_name,
                    ),
                )

            # Stage 4: Evidence Gap Check & Autonomous Follow-up (75% -> 85%)
            storage_service.update_progress(
                investigation_id=investigation_id,
                progress_percent=75,
                stage="analyzing",
                current_query="Evaluating dialectical evidence coverage and residual sensitivity gaps...",
            )

            followup = await self._check_evidence_gaps(
                hypothesis, decomposed.claims, extraction.evaluations, is_mock=is_mock_run
            )

            if followup.needs_followup and followup.followup_query:
                storage_service.append_timeline_event(
                    investigation_id,
                    TimelineEvent(
                        id=f"t-{investigation_id}-gap",
                        timeOffset=elapsed_str(),
                        type=TimelineEventType.GAP,
                        headline="Sensitivity Gap Flagged • Dispatched Follow-Up",
                        detail=followup.gap_reasoning or "Unresolved boundary conditions require targeted secondary inquiry.",
                        query=followup.followup_query,
                        source="Adaptive Investigation Engine",
                    ),
                )

                # Execute one targeted follow-up search
                followup_results = await search_service.search(followup.followup_query, max_results=3)
                for r in followup_results:
                    raw_evidence_list.append(
                        {
                            "claim_id": "followup",
                            "query": followup.followup_query,
                            "title": r.title,
                            "snippet": r.snippet,
                            "url": r.url,
                            "source_name": r.source_name,
                        }
                    )

            # Stage 5: Calibrated Synthesis & Dossier Generation (85% -> 100%)
            storage_service.update_progress(
                investigation_id=investigation_id,
                progress_percent=90,
                stage="analyzing",
                current_query="Compiling Steelman vs. Red Team matrix and Empirical Falsification Plan...",
            )

            # Check if evidence is completely absent / insufficient to draw a verdict
            valid_evals = [e for e in extraction.evaluations if e.excerpt]
            is_inconclusive = len(valid_evals) == 0 and not is_mock_run

            final_report = await self._synthesize_report(
                investigation_id=investigation_id,
                hypothesis=hypothesis,
                decomposed_claims=decomposed.claims,
                evaluations=extraction.evaluations,
                is_mock=is_mock_run,
                force_inconclusive=is_inconclusive,
            )

            # Append concluding timeline decision event
            storage_service.append_timeline_event(
                investigation_id,
                TimelineEvent(
                    id=f"t-{investigation_id}-decision",
                    timeOffset=elapsed_str(),
                    type=TimelineEventType.DECISION,
                    headline="Dialectical Synthesis Finalized",
                    detail=f"Dossier compiled with {final_report.certaintyScore}% empirical certainty. Falsification protocol established.",
                    source="NVIDIA Nemotron Dialectic Synthesizer",
                ),
            )

            # Store and broadcast completion
            if is_inconclusive:
                storage_service.mark_inconclusive(
                    investigation_id,
                    final_report,
                    reason="Insufficient verifiable empirical evidence to establish affirmative or contradictory verdict.",
                )
            else:
                storage_service.mark_completed(investigation_id, final_report)

            logger.info("Investigation %s completed successfully in %s", investigation_id, elapsed_str())

        except MissingCredentialsError as e:
            logger.error("Missing credentials during investigation %s: %s", investigation_id, e)
            storage_service.mark_failed(investigation_id, str(e))
        except (NemotronAPIError, QuotaExceededError) as e:
            logger.error("API error during investigation %s: %s", investigation_id, e)
            storage_service.mark_failed(investigation_id, str(e))
        except Exception as e:
            logger.exception("Unexpected error in investigation %s: %s", investigation_id, e)
            storage_service.mark_failed(investigation_id, f"Investigation failed unexpectedly: {e}")

    # ==========================================================================
    # Sub-Tasks / Reasoning Steps
    # ==========================================================================

    async def _decompose_hypothesis(self, hypothesis: str, is_mock: bool = False) -> ClaimDecompositionOutput:
        """Decomposes the hypothesis into 3-5 specific, testable claims."""
        def mock_factory() -> ClaimDecompositionOutput:
            return ClaimDecompositionOutput(
                claims=[
                    DecomposedClaim(
                        id="c1",
                        claim_text=f"Initial manufacturing and capital emissions/costs of {hypothesis[:30]}",
                        adversarial_angle="Examine upfront resource debt against counter-alternatives.",
                        testable_metric="Direct cradle-to-gate lifecycle CO2-equivalent load",
                    ),
                    DecomposedClaim(
                        id="c2",
                        claim_text="Operational efficiency advantage under standard operating parameters",
                        adversarial_angle="Test whether real-world performance matches controlled laboratory models.",
                        testable_metric="Operational conversion efficiency percentage vs fossil benchmark",
                    ),
                    DecomposedClaim(
                        id="c3",
                        claim_text="Durability, degradation rates, and replacement lifecycle requirements",
                        adversarial_angle="Investigate premature failure and full replacement frequencies.",
                        testable_metric="Degradation slope over 10-year / 150,000-mile operational benchmark",
                    ),
                    DecomposedClaim(
                        id="c4",
                        claim_text="Regional infrastructure sensitivity and grid dependency",
                        adversarial_angle="Evaluate performance under worst-case dirty grid infrastructure.",
                        testable_metric="Breakeven threshold (km) across varying grid emissions intensities",
                    ),
                ]
            )

        messages = [
            {
                "role": "user",
                "content": (
                    f"Decompose the following hypothesis into 3 to 5 distinct, empirical, testable sub-claims. "
                    f"Each claim must isolate a specific factual mechanism rather than broad rhetoric:\n\n"
                    f"HYPOTHESIS: {hypothesis}"
                ),
            }
        ]

        return await nemotron_service.generate_structured(
            messages=messages,
            schema=ClaimDecompositionOutput,
            mock_factory=mock_factory,
        )

    async def _generate_search_plan(
        self, hypothesis: str, claims: List[DecomposedClaim], is_mock: bool = False
    ) -> QueryPlanOutput:
        """Generates targeted disconfirming queries designed to find evidence that disproves each claim."""
        def mock_factory() -> QueryPlanOutput:
            items = []
            for c in claims:
                items.append(
                    SearchQueryItem(
                        claim_id=c.id,
                        query=f"{c.claim_text} counter-evidence empirical studies null results",
                        intent=f"Find contradictory data for: {c.adversarial_angle}",
                    )
                )
            return QueryPlanOutput(queries=items)

        claims_repr = "\n".join([f"- [{c.id}] {c.claim_text} (Target: {c.adversarial_angle})" for c in claims])
        messages = [
            {
                "role": "user",
                "content": (
                    f"Given this hypothesis and its decomposed sub-claims, generate adversarial search queries "
                    f"specifically targeted at finding disconfirming evidence, null results, and methodology critiques:\n\n"
                    f"HYPOTHESIS: {hypothesis}\n\n"
                    f"SUB-CLAIMS:\n{claims_repr}"
                ),
            }
        ]

        return await nemotron_service.generate_structured(
            messages=messages,
            schema=QueryPlanOutput,
            mock_factory=mock_factory,
        )

    async def _extract_and_verify_evidence(
        self,
        hypothesis: str,
        claims: List[DecomposedClaim],
        raw_results: List[dict],
        is_mock: bool = False,
    ) -> EvidenceExtractionOutput:
        """
        Extracts evidence and classifies as supporting/contradicting/mixed/inconclusive.
        Verifies whether source actually supports finding and distinguishes factual contradictions
        from mere opinions or population differences.
        """
        def mock_factory() -> EvidenceExtractionOutput:
            evals = [
                EvidenceEvaluationItem(
                    source_url="https://theicct.org/publication/a-global-comparison-of-the-life-cycle-greenhouse-gas-emissions/",
                    source_name="International Council on Clean Transportation (ICCT)",
                    source_title="A Global Comparison of Passenger Car Life-Cycle Greenhouse Gas Emissions",
                    claim_id=claims[0].id if claims else "c1",
                    stance=StanceType.CONTRADICTING,
                    factual_basis="Empirical fleet analysis demonstrates EV emissions are 66–69% lower in Europe over full lifecycle, refuting the claim of higher net footprint.",
                    excerpt="Lifecycle emissions of battery electric cars are 66%–69% lower in Europe and 60%–68% lower in the United States compared to conventional vehicles.",
                    methodology="Empirical LCA model assessing real-world 200,000 km operation across regional grid mixes.",
                    caveats_or_limitations="Assumes standardized drive cycles; extreme arctic operating ranges experience efficiency penalties.",
                    is_genuine_contradiction=True,
                ),
                EvidenceEvaluationItem(
                    source_url="https://greet.es.anl.gov/",
                    source_name="Argonne National Laboratory",
                    source_title="GREET Lifecycle Model Assessment",
                    claim_id=claims[0].id if claims else "c1",
                    stance=StanceType.SUPPORTING,
                    factual_basis="Corroborates the sub-premise that initial battery manufacturing incurs a 40–50% upfront CO2 equivalent deficit prior to road deployment.",
                    excerpt="Battery manufacturing phase for a 300-mile range vehicle accounts for 35–45% of total production emissions, compared to less than 15% for ICE counterparts.",
                    methodology="Supply-chain and mineral refining lifecycle modeling.",
                    caveats_or_limitations="Sensitive to mineral sourcing provenance and regional smelting energy sources.",
                    is_genuine_contradiction=False,
                ),
                EvidenceEvaluationItem(
                    source_url="https://www.nature.com/articles/s41560-020-0579-x",
                    source_name="Nature Energy",
                    source_title="Regional Sensitivity Assessment of Powertrain Decarbonization",
                    claim_id=claims[1].id if len(claims) > 1 else "c2",
                    stance=StanceType.NEUTRAL,
                    factual_basis="Finds breakeven occurs across 95% of world transport zones, but highlights that ultra-dirty coal networks represent an empirical boundary condition.",
                    excerpt="In 53 of 59 global regions analyzed, electric vehicles already demonstrate lower lifecycle carbon intensity than fossil alternatives.",
                    methodology="Multi-regional input-output grid dispatch modeling.",
                    caveats_or_limitations="Local municipal variations in peak charging hours shift emissions intensity by +/- 12%.",
                    is_genuine_contradiction=False,
                ),
            ]
            return EvidenceExtractionOutput(evaluations=evals, unresolved_gaps=["High-coal grid scenarios"])

        if not raw_results:
            return mock_factory() if is_mock else EvidenceExtractionOutput()

        # Build prompt with raw search snippets
        evidence_snippets = "\n".join(
            [
                f"[{idx+1}] TITLE: {r.get('title')}\nURL: {r.get('url')}\nSNIPPET: {r.get('snippet')}\nCLAIM_ID: {r.get('claim_id')}\n"
                for idx, r in enumerate(raw_results[:12])
            ]
        )

        messages = [
            {
                "role": "user",
                "content": (
                    f"Evaluate the following real web search results against this hypothesis and claims.\n"
                    f"HYPOTHESIS: {hypothesis}\n\n"
                    f"EVIDENCE SOURCES:\n{evidence_snippets}\n\n"
                    f"TASK:\n"
                    f"1. For each valid citation, classify its stance as 'supporting', 'contradicting', or 'neutral'.\n"
                    f"2. CRITICAL: Distinguish genuine FACTUAL contradictions from mere differing opinions, "
                    f"editorial commentary, or scope variances. Set is_genuine_contradiction=true only if empirical data contradicts the premise.\n"
                    f"3. Do NOT fabricate any URLs or quotations. Only extract from the provided snippets.\n"
                    f"4. Identify any remaining unverified evidence gaps."
                ),
            }
        ]

        return await nemotron_service.generate_structured(
            messages=messages,
            schema=EvidenceExtractionOutput,
            mock_factory=mock_factory,
        )

    async def _check_evidence_gaps(
        self,
        hypothesis: str,
        claims: List[DecomposedClaim],
        evaluations: List[EvidenceEvaluationItem],
        is_mock: bool = False,
    ) -> FollowUpPlanOutput:
        """Identifies evidence gaps and plans an autonomous follow-up search when useful."""
        def mock_factory() -> FollowUpPlanOutput:
            return FollowUpPlanOutput(
                needs_followup=True,
                followup_query=f"{hypothesis[:40]} sensitivity analysis extreme scenarios 2025",
                gap_reasoning="Bilateral data verified for typical scenarios; targeted follow-up dispatched for boundary conditions.",
            )

        evaluated_stances = [e.stance.value for e in evaluations]
        has_contradictions = StanceType.CONTRADICTING in evaluated_stances
        has_supporting = StanceType.SUPPORTING in evaluated_stances

        # If we already have strong bilateral coverage, follow-up may be focused on boundary conditions
        messages = [
            {
                "role": "user",
                "content": (
                    f"Evaluate our current evidence coverage for hypothesis: '{hypothesis}'.\n"
                    f"Supporting findings: {len([e for e in evaluations if e.stance == StanceType.SUPPORTING])}\n"
                    f"Contradicting findings: {len([e for e in evaluations if e.stance == StanceType.CONTRADICTING])}\n"
                    f"Determine if a targeted follow-up query is needed to close a coverage gap or test an edge case."
                ),
            }
        ]

        return await nemotron_service.generate_structured(
            messages=messages,
            schema=FollowUpPlanOutput,
            mock_factory=mock_factory,
        )

    async def _synthesize_report(
        self,
        investigation_id: str,
        hypothesis: str,
        decomposed_claims: List[DecomposedClaim],
        evaluations: List[EvidenceEvaluationItem],
        is_mock: bool = False,
        force_inconclusive: bool = False,
    ) -> InvestigationReport:
        """
        Synthesizes the complete Evidence Dossier including:
        - Executive Verdict & Certainty Score
        - Assumption Autopsy
        - Steelman vs. Red Team
        - Evidence Receipts
        - Empirical Falsification Plan
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        def mock_factory() -> InvestigationReport:
            assumptions: List[AssumptionItem] = []
            for idx, c in enumerate(decomposed_claims[:4]):
                status = AssumptionStatus.CONTRADICTED if idx % 2 == 1 else AssumptionStatus.SUPPORTED
                assumptions.append(
                    AssumptionItem(
                        id=f"a{idx+1}",
                        premise=c.claim_text,
                        status=status,
                        vulnerability=f"Empirically tested against {c.adversarial_angle}",
                        coveragePercent=88 - (idx * 6),
                    )
                )

            receipts: List[EvidenceReceipt] = []
            for idx, ev in enumerate(evaluations[:6]):
                receipts.append(
                    EvidenceReceipt(
                        id=f"r{idx+1}",
                        title=ev.source_title,
                        sourceName=ev.source_name,
                        url=ev.source_url,
                        date="2025-06-15",
                        stance=ev.stance,
                        excerpt=ev.excerpt,
                        methodologyNotes=ev.methodology,
                        limitations=ev.caveats_or_limitations,
                    )
                )

            return InvestigationReport(
                id=investigation_id,
                hypothesis=hypothesis,
                timestamp=now_iso,
                verdictSummary=(
                    f"The hypothesis '{hypothesis}' is contradicted under mainstream empirical benchmarks. "
                    f"While initial manufacturing debts are verified, operational efficiencies and lifecycle amortization "
                    f"overturn the disparity in over 90% of observed contexts."
                ),
                certaintyScore=82,
                biasIndex="High Empirical Consensus",
                stoppingRationale="Bilateral counter-evidence and corroborating lifecycle data retrieved across peer-reviewed repositories.",
                assumptions=assumptions,
                timeline=[],
                steelman=DialecticalCase(
                    title="Steelman Case (Affirmative Arguments)",
                    coreArgument="Under constrained conditions (short operational life or ultra-carbon-heavy grid networks), the proposition holds merit.",
                    keyFindings=[
                        "Upfront manufacturing incurs a 40–50% initial carbon/resource debt before deployment.",
                        "Extreme fossil-reliant energy grids prolong the operational breakeven threshold significantly.",
                        "Smaller hybrid architectures require fewer scarce mineral inputs.",
                    ],
                    primarySources=["Argonne National Laboratory GREET Model", "Nature Communications"],
                ),
                redTeam=DialecticalCase(
                    title="Red Team Counter-Case (Adversarial Refutation)",
                    coreArgument="In real-world deployment, powertrain efficiency advantages amortize initial manufacturing deficits rapidly.",
                    keyFindings=[
                        "Operational efficiency advantages exceed 85% compared to 25–35% in internal combustion engines.",
                        "Grid decarbonization continually lowers operational emissions year-over-year.",
                        "Battery longevity data demonstrates 85%+ retention after 150,000 miles, eliminating early pack replacement debts.",
                    ],
                    primarySources=["International Council on Clean Transportation (ICCT)", "BloombergNEF"],
                ),
                evidenceReceipts=receipts,
                falsificationPlan=FalsificationPlan(
                    testProcedure="Conduct an independent lifecycle carbon audit in an operating territory with grid carbon intensity exceeding 800g CO2/kWh.",
                    measurableMetric="Lifecycle grams of CO2-equivalent per vehicle-kilometer over a verified 100,000 km lifecycle.",
                    falsificationThreshold="If the cumulative lifecycle emissions exceed the benchmark by more than 15% after 80,000 km, the counter-verdict is refuted.",
                    counterEvidenceRequired="Certified independent emissions telemetry from certified regional grid monitors.",
                ),
                is_mock=True,
            )

        if force_inconclusive:
            return InvestigationReport(
                id=investigation_id,
                hypothesis=hypothesis,
                timestamp=now_iso,
                verdictSummary=(
                    f"Inconclusive: Insufficient verifiable empirical evidence was retrieved to confirm or falsify "
                    f"the hypothesis '{hypothesis}'. Further empirical trial data is required."
                ),
                certaintyScore=25,
                biasIndex="Insufficient Evidence Base",
                stoppingRationale="Web retrieval search rounds yielded no verified empirical datasets or peer-reviewed citations meeting credibility thresholds.",
                assumptions=[
                    AssumptionItem(
                        id=f"a{idx+1}",
                        premise=c.claim_text,
                        status=AssumptionStatus.UNRESOLVED,
                        vulnerability="Unverified due to absence of credible citations.",
                        coveragePercent=15,
                    )
                    for idx, c in enumerate(decomposed_claims)
                ],
                timeline=[],
                steelman=DialecticalCase(
                    title="Steelman Case (Hypothetical Affirmative)",
                    coreArgument="Theoretical arguments supporting the hypothesis cannot be validated due to lack of accessible empirical studies.",
                    keyFindings=["No conclusive empirical studies retrieved."],
                    primarySources=[],
                ),
                redTeam=DialecticalCase(
                    title="Red Team Counter-Case (Hypothetical Refutation)",
                    coreArgument="Counterarguments cannot be substantiated without documented counter-trials.",
                    keyFindings=["Absence of verified counter-evidence."],
                    primarySources=[],
                ),
                evidenceReceipts=[],
                falsificationPlan=FalsificationPlan(
                    testProcedure="Execute a controlled, pre-registered randomized trial measuring primary outcome variables.",
                    measurableMetric="Empirical effect size with 95% confidence intervals.",
                    falsificationThreshold="P-value < 0.05 against null hypothesis with statistical power >= 0.80.",
                    counterEvidenceRequired="Peer-reviewed publication in an indexed scientific repository.",
                ),
                is_mock=is_mock,
            )

        # In live mode or mock fallback:
        # Prompt Nemotron to synthesize the complete structured report
        evals_summary = "\n".join(
            [
                f"- [{e.stance.value.upper()}] {e.source_name}: {e.excerpt} (Factual basis: {e.factual_basis})"
                for e in evaluations
            ]
        )

        messages = [
            {
                "role": "user",
                "content": (
                    f"Synthesize an Evidence Dossier for the hypothesis:\n"
                    f"HYPOTHESIS: {hypothesis}\n\n"
                    f"VERIFIED EVIDENCE FINDINGS:\n{evals_summary}\n\n"
                    f"REQUIREMENTS:\n"
                    f"1. Executive verdict summarizing whether empirical data supports, contradicts, or presents a nuanced verdict.\n"
                    f"2. Certainty score (0-100%) and bias classification.\n"
                    f"3. Bilateral dialectic: Steelman (strongest affirmative argument) and Red Team (strongest counter-argument).\n"
                    f"4. Evidence receipts referencing only the real verified citations.\n"
                    f"5. Concrete Empirical Falsification Plan with operational test procedure and measurable threshold."
                ),
            }
        ]

        report = await nemotron_service.generate_structured(
            messages=messages,
            schema=InvestigationReport,
            mock_factory=mock_factory,
        )
        report.id = investigation_id
        report.hypothesis = hypothesis
        report.timestamp = now_iso
        report.is_mock = is_mock
        return report


agent_service = AgentService()
