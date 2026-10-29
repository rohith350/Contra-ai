import asyncio
from typing import Dict, Any
from collections import defaultdict

# Simple in‑memory store for investigation state and event streams

# State shape matches schemas.InvestigationStateResponse
_STATE: Dict[str, Dict[str, Any]] = {}

# Each investigation gets an asyncio.Queue of event dicts that the SSE endpoint will read
_EVENT_QUEUES: Dict[str, asyncio.Queue] = defaultdict(asyncio.Queue)

def init_state(inv_id: str, hypothesis: str) -> None:
    """Create a fresh state entry for a new investigation."""
    _STATE[inv_id] = {
        "hypothesis": hypothesis,
        "status": "queued",
        "progress": {"subclaims_total": 0, "subclaims_done": 0},
        "error": None,
        "report": None,
    }
    # Ensure an empty event queue exists
    _EVENT_QUEUES[inv_id] = asyncio.Queue()

def update_state(inv_id: str, **kwargs) -> None:
    """Merge provided keys into the stored state and push an event to the queue."""
    state = _STATE.get(inv_id)
    if not state:
        return
    state.update(kwargs)
    # Push a shallow copy as the event payload
    asyncio.create_task(_EVENT_QUEUES[inv_id].put(state.copy()))

def get_state(inv_id: str) -> Dict[str, Any] | None:
    return _STATE.get(inv_id)

def get_queue(inv_id: str) -> asyncio.Queue | None:
    return _EVENT_QUEUES.get(inv_id)

def set_report(inv_id: str, report: Dict[str, Any]) -> None:
    update_state(inv_id, status="completed", report=report)

def set_error(inv_id: str, error_msg: str) -> None:
    update_state(inv_id, status="failed", error=error_msg)
