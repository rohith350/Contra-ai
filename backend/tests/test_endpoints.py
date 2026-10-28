"""
Tests for Contra AI FastAPI endpoints.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from backend.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify GET /health returns service status and configured application limits."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "application_limits" in data
        assert "max_search_queries" in data["application_limits"]


@pytest.mark.asyncio
async def test_create_and_poll_investigation():
    """Verify POST /api/investigations and GET /api/investigations/{id}."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create investigation
        payload = {
            "hypothesis": "Electric vehicles have higher lifecycle emissions than modern hybrids."
        }
        res_create = await client.post("/api/investigations", json=payload)
        assert res_create.status_code == 201
        created_data = res_create.json()
        assert "id" in created_data
        assert created_data["status"] == "queued"
        inv_id = created_data["id"]

        # Poll status
        res_status = await client.get(f"/api/investigations/{inv_id}")
        assert res_status.status_code == 200
        status_data = res_status.json()
        assert status_data["id"] == inv_id
        assert status_data["hypothesis"] == payload["hypothesis"]
        assert "progress_percent" in status_data


@pytest.mark.asyncio
async def test_create_investigation_validation():
    """Verify that too short hypothesis (< 5 chars) is rejected with 422 Unprocessable Entity."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/investigations", json={"hypothesis": "Hi"})
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_nonexistent_investigation_returns_404():
    """Verify that requesting a nonexistent ID returns 404 Not Found."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_status = await client.get("/api/investigations/inv-does-not-exist")
        assert res_status.status_code == 404

        res_report = await client.get("/api/investigations/inv-does-not-exist/report")
        assert res_report.status_code == 404
