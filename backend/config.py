"""
Backend configuration module.
Loads settings from environment variables and .env file with zero-paid quota safety limits.
"""

from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables from .env file located at repository root
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


class Settings(BaseModel):
    # Nebius Token Factory / NVIDIA Nemotron configuration
    nebius_api_key: str = Field(
        default_factory=lambda: os.getenv("NEBIUS_API_KEY", "").strip()
    )
    nebius_base_url: str = Field(
        default_factory=lambda: os.getenv(
            "NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.ai/v1"
        ).strip().rstrip("/")
    )
    nebius_model_id: str = Field(
        default_factory=lambda: os.getenv(
            "NEBIUS_MODEL_ID", "nvidia/nemotron-4-340b-instruct"
        ).strip()
    )

    # Local Mock & Demo Mode
    allow_mock_fallback: bool = Field(
        default_factory=lambda: os.getenv("ALLOW_MOCK_FALLBACK", "true").lower()
        in ("true", "1", "yes")
    )
    mock_mode: bool = Field(
        default_factory=lambda: os.getenv("MOCK_MODE", "false").lower()
        in ("true", "1", "yes")
    )

    # Free-Demo & Application-Level Quota Limits
    max_search_queries: int = Field(
        default_factory=lambda: int(os.getenv("MAX_SEARCH_QUERIES", "5"))
    )
    max_results_per_query: int = Field(
        default_factory=lambda: int(os.getenv("MAX_RESULTS_PER_QUERY", "4"))
    )
    max_model_calls: int = Field(
        default_factory=lambda: int(os.getenv("MAX_MODEL_CALLS", "10"))
    )
    max_output_tokens: int = Field(
        default_factory=lambda: int(os.getenv("MAX_OUTPUT_TOKENS", "2048"))
    )
    investigation_timeout_seconds: int = Field(
        default_factory=lambda: int(
            os.getenv("INVESTIGATION_TIMEOUT_SECONDS", "120")
        )
    )

    # Storage and Server Paths
    data_dir: Path = Field(
        default_factory=lambda: ROOT_DIR
        / os.getenv("DATA_DIR", "data/investigations")
    )
    backend_host: str = Field(
        default_factory=lambda: os.getenv("BACKEND_HOST", "127.0.0.1")
    )
    backend_port: int = Field(
        default_factory=lambda: int(os.getenv("BACKEND_PORT", "8000"))
    )

    @property
    def has_nebius_credentials(self) -> bool:
        """Returns True if a non-empty NEBIUS_API_KEY is configured."""
        return bool(self.nebius_api_key and len(self.nebius_api_key) > 5)

    @property
    def effective_mock_mode(self) -> bool:
        """Returns True if mock inference should run (explicit mock_mode or missing key with fallback)."""
        if self.mock_mode:
            return True
        if not self.has_nebius_credentials and self.allow_mock_fallback:
            return True
        return False


settings = Settings()
