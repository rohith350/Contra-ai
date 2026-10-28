"""
JSON-backed persistence and in-memory event bus for investigations.
Supports async event subscriptions for Server-Sent Events (SSE).
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncGenerator, Dict, List, Optional

from backend.config import settings
from backend.models.schemas import (
    InvestigationReport,
    InvestigationStatus,
    InvestigationStatusResponse,
    TimelineEvent,
)

logger = logging.getLogger(__name__)


class InvestigationRecord:
    def __init__(
        self,
        investigation_id: str,
        hypothesis: str,
        is_mock: bool = False,
    ):
        now = datetime.now(timezone.utc).isoformat()
        self.id = investigation_id
        self.hypothesis = hypothesis
        self.status = InvestigationStatus.QUEUED
        self.progress_percent = 0
        self.current_stage = "queued"
        self.current_query: Optional[str] = None
        self.claims_decomposed: List[str] = []
        self.timeline: List[TimelineEvent] = []
        self.report: Optional[InvestigationReport] = None
        self.error_message: Optional[str] = None
        self.created_at = now
        self.updated_at = now
        self.is_mock = is_mock

    def to_status_response(self) -> InvestigationStatusResponse:
        return InvestigationStatusResponse(
            id=self.id,
            hypothesis=self.hypothesis,
            status=self.status,
            progress_percent=self.progress_percent,
            current_stage=self.current_stage,
            current_query=self.current_query,
            claims_decomposed=self.claims_decomposed,
            timeline_events_count=len(self.timeline),
            created_at=self.created_at,
            updated_at=self.updated_at,
            error_message=self.error_message,
            is_mock=self.is_mock,
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "hypothesis": self.hypothesis,
            "status": self.status.value,
            "progress_percent": self.progress_percent,
            "current_stage": self.current_stage,
            "current_query": self.current_query,
            "claims_decomposed": self.claims_decomposed,
            "timeline": [t.model_dump() for t in self.timeline],
            "report": self.report.model_dump() if self.report else None,
            "error_message": self.error_message,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_mock": self.is_mock,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "InvestigationRecord":
        rec = cls(
            investigation_id=data["id"],
            hypothesis=data["hypothesis"],
            is_mock=data.get("is_mock", False),
        )
        rec.status = InvestigationStatus(data.get("status", "queued"))
        rec.progress_percent = data.get("progress_percent", 0)
        rec.current_stage = data.get("current_stage", "queued")
        rec.current_query = data.get("current_query")
        rec.claims_decomposed = data.get("claims_decomposed", [])
        rec.timeline = [
            TimelineEvent.model_validate(t) for t in data.get("timeline", [])
        ]
        if data.get("report"):
            rec.report = InvestigationReport.model_validate(data["report"])
        rec.error_message = data.get("error_message")
        rec.created_at = data.get("created_at", rec.created_at)
        rec.updated_at = data.get("updated_at", rec.updated_at)
        return rec


class StorageService:
    def __init__(self):
        self._investigations: Dict[str, InvestigationRecord] = {}
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}
        self._dir: Path = settings.data_dir
        self._ensure_storage_dir()
        self._load_persisted()

    def _ensure_storage_dir(self):
        try:
            self._dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.warning("Could not create storage dir %s: %s", self._dir, e)

    def _load_persisted(self):
        """Loads previously saved investigations from disk on startup."""
        if not self._dir.exists():
            return
        for file in self._dir.glob("*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    record = InvestigationRecord.from_dict(data)
                    self._investigations[record.id] = record
            except Exception as e:
                logger.error("Failed loading investigation file %s: %s", file, e)

    def _save_to_disk(self, record: InvestigationRecord):
        try:
            self._ensure_storage_dir()
            file_path = self._dir / f"{record.id}.json"
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(record.to_dict(), f, indent=2)
        except Exception as e:
            logger.error("Failed saving investigation %s to disk: %s", record.id, e)

    def create(self, investigation_id: str, hypothesis: str, is_mock: bool = False) -> InvestigationRecord:
        record = InvestigationRecord(investigation_id, hypothesis, is_mock=is_mock)
        self._investigations[investigation_id] = record
        self._save_to_disk(record)
        return record

    def get(self, investigation_id: str) -> Optional[InvestigationRecord]:
        return self._investigations.get(investigation_id)

    def update_progress(
        self,
        investigation_id: str,
        progress_percent: int,
        stage: str,
        current_query: Optional[str] = None,
        claims_decomposed: Optional[List[str]] = None,
    ):
        record = self.get(investigation_id)
        if not record:
            return
        record.progress_percent = min(100, max(0, progress_percent))
        record.current_stage = stage
        record.updated_at = datetime.now(timezone.utc).isoformat()
        if current_query is not None:
            record.current_query = current_query
        if claims_decomposed is not None:
            record.claims_decomposed = claims_decomposed
        if record.status == InvestigationStatus.QUEUED:
            record.status = InvestigationStatus.RESEARCHING

        self._save_to_disk(record)
        self._publish_event(
            investigation_id,
            "progress",
            {
                "progress_percent": record.progress_percent,
                "current_stage": record.current_stage,
                "current_query": record.current_query,
                "claims_decomposed": record.claims_decomposed,
            },
        )

    def append_timeline_event(self, investigation_id: str, event: TimelineEvent):
        record = self.get(investigation_id)
        if not record:
            return
        record.timeline.append(event)
        record.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(record)
        self._publish_event(investigation_id, "timeline", event.model_dump())

    def mark_completed(self, investigation_id: str, report: InvestigationReport):
        record = self.get(investigation_id)
        if not record:
            return
        record.status = InvestigationStatus.COMPLETED
        record.progress_percent = 100
        record.current_stage = "completed"
        record.report = report
        record.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(record)
        self._publish_event(investigation_id, "complete", report.model_dump())

    def mark_inconclusive(self, investigation_id: str, report: InvestigationReport, reason: str):
        record = self.get(investigation_id)
        if not record:
            return
        record.status = InvestigationStatus.INCONCLUSIVE
        record.progress_percent = 100
        record.current_stage = "inconclusive"
        record.report = report
        record.error_message = reason
        record.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(record)
        self._publish_event(
            investigation_id,
            "inconclusive",
            {"report": report.model_dump(), "reason": reason},
        )

    def mark_failed(self, investigation_id: str, error_message: str):
        record = self.get(investigation_id)
        if not record:
            return
        record.status = InvestigationStatus.FAILED
        record.current_stage = "failed"
        record.error_message = error_message
        record.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(record)
        self._publish_event(investigation_id, "error", {"error": error_message})

    def _publish_event(self, investigation_id: str, event_type: str, data: dict):
        queues = self._subscribers.get(investigation_id, [])
        for q in queues:
            try:
                q.put_nowait({"event": event_type, "data": data})
            except Exception:
                pass

    async def subscribe(self, investigation_id: str) -> AsyncGenerator[dict, None]:
        q: asyncio.Queue = asyncio.Queue()
        if investigation_id not in self._subscribers:
            self._subscribers[investigation_id] = []
        self._subscribers[investigation_id].append(q)

        try:
            # Yield initial status immediately
            record = self.get(investigation_id)
            if record:
                yield {
                    "event": "status",
                    "data": record.to_status_response().model_dump(),
                }
                for t in record.timeline:
                    yield {"event": "timeline", "data": t.model_dump()}
                if record.status == InvestigationStatus.COMPLETED and record.report:
                    yield {"event": "complete", "data": record.report.model_dump()}
                    return
                if record.status == InvestigationStatus.FAILED:
                    yield {"event": "error", "data": {"error": record.error_message}}
                    return

            while True:
                msg = await q.get()
                yield msg
                if msg.get("event") in ("complete", "error", "inconclusive"):
                    break
        finally:
            if investigation_id in self._subscribers and q in self._subscribers[investigation_id]:
                self._subscribers[investigation_id].remove(q)


storage_service = StorageService()
