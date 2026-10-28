"""
Investigation lifecycle API endpoints for Contra AI.
Includes investigation creation, polling status, SSE streaming, and final report retrieval.
"""

from __future__ import annotations

import asyncio
import json
import uuid
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from backend.config import settings
from backend.models.schemas import (
    InvestigationCreateRequest,
    InvestigationCreateResponse,
    InvestigationReport,
    InvestigationStatus,
    InvestigationStatusResponse,
)
from backend.services.agent_service import agent_service
from backend.services.storage_service import storage_service

router = APIRouter(prefix="/api/investigations", tags=["Investigations"])


@router.post(
    "",
    response_model=InvestigationCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new contradiction investigation",
)
async def create_investigation(payload: InvestigationCreateRequest):
    """
    Accepts a user hypothesis, initializes the investigation lifecycle,
    and dispatches asynchronous background research.
    """
    investigation_id = f"inv-{uuid.uuid4().hex[:8]}"
    is_mock = settings.effective_mock_mode

    # Register record in storage
    record = storage_service.create(
        investigation_id=investigation_id,
        hypothesis=payload.hypothesis,
        is_mock=is_mock,
    )

    # Launch autonomous agent as background task
    asyncio.create_task(
        agent_service.run_investigation(
            investigation_id=investigation_id,
            hypothesis=payload.hypothesis,
            attached_sources=payload.attached_sources,
        )
    )

    return InvestigationCreateResponse(
        id=record.id,
        status=record.status,
        message="Investigation successfully created and queued for dialectical research.",
    )


@router.get(
    "/{investigation_id}",
    response_model=InvestigationStatusResponse,
    summary="Retrieve current investigation status and telemetry",
)
async def get_investigation_status(investigation_id: str):
    """
    Returns the real-time execution state, progress percentage, active query vector,
    and decomposed claims for a given investigation.
    """
    record = storage_service.get(investigation_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found.",
        )
    return record.to_status_response()


@router.get(
    "/{investigation_id}/events",
    summary="Stream live investigation progress via Server-Sent Events (SSE)",
)
async def stream_investigation_events(investigation_id: str):
    """
    Streams live telemetry events (search vectors, discoveries, contradictions,
    coverage checks, and final report) using Server-Sent Events.
    """
    record = storage_service.get(investigation_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found.",
        )

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for item in storage_service.subscribe(investigation_id):
                event_name = item.get("event", "message")
                data_payload = json.dumps(item.get("data", {}))
                yield f"event: {event_name}\ndata: {data_payload}\n\n"
        except asyncio.CancelledError:
            pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/{investigation_id}/report",
    response_model=InvestigationReport,
    summary="Retrieve final synthesized evidence dossier",
)
async def get_investigation_report(investigation_id: str):
    """
    Returns the complete synthesized Evidence Dossier (Executive Conclusion,
    Assumption Autopsy, Steelman vs. Red Team, Evidence Receipts, Falsification Plan).
    """
    record = storage_service.get(investigation_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found.",
        )

    if record.status in (InvestigationStatus.QUEUED, InvestigationStatus.RESEARCHING):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Investigation is still in progress. Check /events or status endpoint.",
        )

    if record.status == InvestigationStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Investigation failed: {record.error_message}",
        )

    if not record.report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No report generated for this investigation.",
        )

    return record.report
