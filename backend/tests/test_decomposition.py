"""
Tests for claim decomposition.
Verifies that hypotheses are decomposed into 3-5 specific, testable claims with adversarial angles.
"""

import pytest
from backend.models.schemas import ClaimDecompositionOutput, DecomposedClaim
from backend.services.agent_service import agent_service


@pytest.mark.asyncio
async def test_claim_decomposition_structure():
    """Verify that decomposed claims meet the 3-5 item constraint and have testable metrics."""
    hypothesis = "Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles."
    result = await agent_service._decompose_hypothesis(hypothesis, is_mock=True)

    assert isinstance(result, ClaimDecompositionOutput)
    assert 3 <= len(result.claims) <= 5

    for claim in result.claims:
        assert isinstance(claim, DecomposedClaim)
        assert len(claim.claim_text.strip()) > 5
        assert len(claim.adversarial_angle.strip()) > 5
        assert len(claim.testable_metric.strip()) > 5


@pytest.mark.asyncio
async def test_claim_decomposition_adversarial_queries():
    """Verify that search queries generated from decomposed claims target counter-evidence."""
    claims = [
        DecomposedClaim(
            id="c1",
            claim_text="Initial battery manufacturing carbon load",
            adversarial_angle="Test whether upfront debt exceeds ICE baseline",
            testable_metric="Cradle-to-gate CO2-eq",
        ),
        DecomposedClaim(
            id="c2",
            claim_text="Powertrain thermal conversion efficiency",
            adversarial_angle="Test real-world conversion vs fossil hybrid",
            testable_metric="Well-to-wheel efficiency %",
        ),
        DecomposedClaim(
            id="c3",
            claim_text="Battery longevity and degradation",
            adversarial_angle="Investigate premature pack failure rate",
            testable_metric="Capacity retention at 150k miles",
        ),
    ]

    plan = await agent_service._generate_search_plan(
        hypothesis="EV vs Hybrid lifecycle emissions",
        claims=claims,
        is_mock=True,
    )

    assert len(plan.queries) >= 3
    for q in plan.queries:
        assert q.claim_id in ["c1", "c2", "c3"]
        assert len(q.query.strip()) > 5
        assert "counter-evidence" in q.query or "null" in q.query or "disprove" in q.intent.lower()
