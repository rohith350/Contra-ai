"""
Tests for API failure scenarios (timeouts, rate limits, 500s, and quota limits).
"""

import httpx
import pytest
from backend.config import settings
from backend.models.schemas import ClaimDecompositionOutput
from backend.services.nemotron_service import (
    NemotronAPIError,
    QuotaExceededError,
    nemotron_service,
)


@pytest.mark.asyncio
async def test_quota_exceeded_raises_safe_error(monkeypatch):
    """Verify that exceeding MAX_MODEL_CALLS raises a clear QuotaExceededError."""
    monkeypatch.setattr(nemotron_service, "_call_count", settings.max_model_calls)

    with pytest.raises(QuotaExceededError) as exc_info:
        await nemotron_service.generate_structured(
            messages=[{"role": "user", "content": "Test"}],
            schema=ClaimDecompositionOutput,
        )

    assert "Application-level limit reached" in str(exc_info.value)
    # Reset call counter
    nemotron_service.reset_call_counter()


@pytest.mark.asyncio
async def test_rate_limit_429_handling(monkeypatch):
    """Verify that HTTP 429 returns a clear NemotronAPIError specifying rate limits."""
    monkeypatch.setattr(settings, "nebius_api_key", "mock-token-xyz")
    monkeypatch.setattr(settings, "allow_mock_fallback", False)
    monkeypatch.setattr(settings, "mock_mode", False)

    # Mock httpx response to return 429
    class Mock429Response:
        status_code = 429
        text = "Too many requests"

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return Mock429Response()

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    with pytest.raises(NemotronAPIError) as exc_info:
        await nemotron_service.generate_structured(
            messages=[{"role": "user", "content": "Test"}],
            schema=ClaimDecompositionOutput,
        )

    assert "rate limit exceeded" in str(exc_info.value).lower()
    nemotron_service.reset_call_counter()


@pytest.mark.asyncio
async def test_server_error_500_handling(monkeypatch):
    """Verify that HTTP 500 returns a clear NemotronAPIError."""
    monkeypatch.setattr(settings, "nebius_api_key", "mock-token-xyz")
    monkeypatch.setattr(settings, "allow_mock_fallback", False)
    monkeypatch.setattr(settings, "mock_mode", False)

    class Mock500Response:
        status_code = 500
        text = "Internal Engine Error"

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return Mock500Response()

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    with pytest.raises(NemotronAPIError) as exc_info:
        await nemotron_service.generate_structured(
            messages=[{"role": "user", "content": "Test"}],
            schema=ClaimDecompositionOutput,
        )

    assert "Nemotron API error (HTTP 500)" in str(exc_info.value)
    nemotron_service.reset_call_counter()
