"""
Tests for handling missing credentials and local mock fallback behavior.
"""

import pytest
from backend.config import settings
from backend.models.schemas import ClaimDecompositionOutput
from backend.services.nemotron_service import (
    MissingCredentialsError,
    nemotron_service,
)


@pytest.mark.asyncio
async def test_missing_credentials_raises_when_fallback_disabled(monkeypatch):
    """Verify that MissingCredentialsError is raised when credentials are missing and fallback is disabled."""
    monkeypatch.setattr(settings, "nebius_api_key", "")
    monkeypatch.setattr(settings, "allow_mock_fallback", False)
    monkeypatch.setattr(settings, "mock_mode", False)

    messages = [{"role": "user", "content": "Decompose this claim."}]

    with pytest.raises(MissingCredentialsError) as exc_info:
        await nemotron_service.generate_structured(
            messages=messages,
            schema=ClaimDecompositionOutput,
        )

    assert "NEBIUS_API_KEY" in str(exc_info.value)
    assert "ALLOW_MOCK_FALLBACK" in str(exc_info.value)


@pytest.mark.asyncio
async def test_mock_fallback_works_when_credentials_missing(monkeypatch):
    """Verify that when fallback is enabled, mock inference safely executes without crashing."""
    monkeypatch.setattr(settings, "nebius_api_key", "")
    monkeypatch.setattr(settings, "allow_mock_fallback", True)

    def dummy_mock():
        from backend.models.schemas import DecomposedClaim
        return ClaimDecompositionOutput(
            claims=[
                DecomposedClaim(
                    id=f"c{i}",
                    claim_text=f"Claim {i}",
                    adversarial_angle=f"Angle {i}",
                    testable_metric=f"Metric {i}",
                )
                for i in range(1, 4)
            ]
        )

    result = await nemotron_service.generate_structured(
        messages=[{"role": "user", "content": "Test claim"}],
        schema=ClaimDecompositionOutput,
        mock_factory=dummy_mock,
    )

    assert isinstance(result, ClaimDecompositionOutput)
    assert len(result.claims) == 3
