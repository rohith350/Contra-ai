"""Routes package for Contra AI."""

from .health import router as health_router
from .investigations import router as investigations_router

__all__ = ["health_router", "investigations_router"]
