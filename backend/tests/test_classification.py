"""
Tests for evidence classification and factual verification.
Verifies proper categorization (supporting, contradicting, neutral) and distinguishes
genuine empirical contradictions from mere opinions or scope differences.
"""

import pytest
from backend.models.schemas import (
    DecomposedClaim,
    EvidenceEvaluationItem,
    StanceType,
)
from backend.services.agent_service import agent_service


@pytest.mark.asyncio
async def test_evidence_classification_and_verification():
    """Verify classification categories and empirical vs opinion distinction."""
    hypothesis = "Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles."
    claims = [
        DecomposedClaim(
            id="c1",
            claim_text="Initial battery manufacturing carbon load",
            adversarial_angle="Test whether upfront debt exceeds ICE baseline",
            testable_metric="Cradle-to-gate CO2-eq",
        )
    ]

    extraction = await agent_service._extract_and_verify_evidence(
        hypothesis=hypothesis,
        claims=claims,
        raw_results=[],
        is_mock=True,
    )

    evals = extraction.evaluations
    assert len(evals) >= 2

    # Check that stances are properly typed
    stances = {e.stance for e in evals}
    assert StanceType.CONTRADICTING in stances
    assert StanceType.SUPPORTING in stances

    # Verify genuine factual contradiction flag
    for item in evals:
        assert isinstance(item, EvidenceEvaluationItem)
        assert len(item.excerpt) > 10
        assert len(item.methodology) > 5
        assert len(item.factual_basis) > 5
        if item.stance == StanceType.CONTRADICTING:
            # Must document factual basis
            assert item.is_genuine_contradiction is True


def test_factual_vs_opinion_distinction_schema():
    """Verify that EvidenceEvaluationItem enforces the factual_basis distinction field."""
    item = EvidenceEvaluationItem(
        source_url="https://example.org/study-1",
        source_name="Empirical Research Institute",
        source_title="Field Measurement of Hybrid Powertrains",
        claim_id="c1",
        stance=StanceType.CONTRADICTING,
        factual_basis="Direct dynamometer fuel efficiency logs contradict claimed 50% thermal efficiency.",
        excerpt="Measured thermal efficiency peaked at 34.2%, well below stated assumptions.",
        methodology="Bench testing over 500 hours under standard SAE J1349 conditions.",
        caveats_or_limitations="Ambient test temperatures fixed at 20°C.",
        is_genuine_contradiction=True,
    )

    assert item.is_genuine_contradiction is True
    assert "dynamometer" in item.factual_basis
