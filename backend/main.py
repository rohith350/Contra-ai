'''\
Main FastAPI Application Entry Point for Contra AI.
Evidence-driven contradiction research agent powered by NVIDIA Nemotron.
'''\

from __future__ import annotations\
\
import logging\
from fastapi import FastAPI\
from fastapi.middleware.cors import CORSMiddleware\
\
from backend.config import settings\
from backend.routes.health import router as health_router\
from backend.routes.investigations import router as investigations_router\
\
# Configure logging\
logging.basicConfig(\
    level=logging.INFO,\
    format="%(asctime)s [%(levellevel)s] %(name)s: %(message)s",\
)\
logger = logging.getLogger("contra-backend")\
\
from contextlib import asynccontextmanager\
\
@asynccontextmanager\
async def lifespan(app: FastAPI):\
    logger.info("Contra AI Backend initialized.")\
    logger.info("Runtime model: %s", settings.nebius_model_id)\
    logger.info("Nebius credentials configured: %s", settings.has_nebius_credentials)\
    logger.info(\
        "Safety limits: Max queries=%d, Max model calls=%d",\
        settings.max_search_queries,\
        settings.max_model_calls,\
    )\
    yield\
\
app = FastAPI(\
    title="Contra AI — Contradiction Discovery Agent",\
    description="Autonomous evidence‑driven research agent that challenges hypotheses and confirmation bias using NVIDIA Nemotron.",\
    version="1.0.0",\
    lifespan=lifespan,\
)\
\
# Configure CORS for local development with Vite\
app.add_middleware(\
    CORSMiddleware,\
    allow_origins=[\
        "http://localhost:5173",\
        "http://127.0.0.1:5173",\
        "http://localhost:3000",\
        "http://127.0.0.1:3000",\
        "*",\
    ],\
    allow_credentials=True,\
    allow_methods=["*"],\
    allow_headers=["*"],\
)\
\
# Register API routes\
app.include_router(health_router)\
app.include_router(investigations_router)\
\
if __name__ == "__main__":\
    import uvicorn\
\
    uvicorn.run(\
        "backend.main:app",\
        host=settings.backend_host,\
        port=settings.backend_port,\
        reload=True,\
    )