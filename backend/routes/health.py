"""
Health check and system telemetry endpoint.
"""

from fastapi import APIRouter
from backend.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """
    Returns backend service health, credentials status, and safety limits.
    """
    return {
        "status": "healthy",
        "service": "Contra AI Dialectical Backend",
        "version": "1.0.0",
        "runtime_model": settings.nebius_model_id,
        "nebius_configured": settings.has_nebius_credentials,
        "mock_mode_active": settings.effective_mock_mode,
        "application_limits": {
            "max_search_queries": settings.max_search_queries,
            "max_results_per_query": settings.max_results_per_query,
            "max_model_calls": settings.max_model_calls,
            "max_output_tokens": settings.max_output_tokens,
            "timeout_seconds": settings.investigation_timeout_seconds,
        },
    }
