"""
Tests for handling inconclusive verdicts when evidence is insufficient.
"""

import pytest
from backend.models.schemas import (
    AssumptionStatus,
    DecomposedClaim,
    InvestigationReport,
)
from backend.services.agent_service import agent_service


@pytest.mark.asyncio
async def test_inconclusive_verdict_when_evidence_insufficient():
    """Verify that force_inconclusive generates a calibrated report with low certainty and unresolved claims."""
    claims = [
        DecomposedClaim(
            id="c1",
            claim_text="Obscure metaphysical assertion with zero empirical trial literature",
            adversarial_angle="Look for null hypothesis verification",
            testable_metric="Direct measured effect size",
        )
    ]

    report = await agent_service._synthesize_report(
        investigation_id="inv-inconclusive-test",
        hypothesis="Obscure metaphysical proposition",
        decomposed_claims=claims,
        evaluations=[],
        is_mock=False,
        force_inconclusive=True,
    )

    assert isinstance(report, InvestigationReport)
    assert report.certaintyScore <= 30
    assert "Inconclusive" in report.verdictSummary
    assert report.biasIndex == "Insufficient Evidence Base"
    assert len(report.assumptions) == 1
    assert report.assumptions[0].status == AssumptionStatus.UNRESOLVED
    assert "insufficient" in report.stoppingRationale.lower() or "no verified" in report.stoppingRationale.lower()
