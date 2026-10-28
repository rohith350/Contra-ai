"""
Dedicated service client for NVIDIA Nemotron via Nebius Token Factory.
Uses OpenAI-compatible /chat/completions interface with Pydantic structured output validation,
timeouts, rate limit handling, and safe zero-paid local fallback mode.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel, ValidationError

from backend.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class MissingCredentialsError(Exception):
    """Raised when Nebius API credentials are missing and mock fallback is disabled."""
    pass


class NemotronAPIError(Exception):
    """Raised when the remote Nemotron / Nebius API returns an error or invalid format."""
    pass


class QuotaExceededError(Exception):
    """Raised when application-level zero-paid quota is reached."""
    pass


class NemotronService:
    def __init__(self):
        self._call_count = 0

    def reset_call_counter(self):
        self._call_count = 0

    @property
    def call_count(self) -> int:
        return self._call_count

    def _clean_json_markdown(self, raw_text: str) -> str:
        """Strips markdown code fences (e.g. ```json ... ```) from LLM output."""
        text = raw_text.strip()
        # Remove opening ```json or ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            return match.group(1).strip()
        return text

    async def generate_structured(
        self,
        messages: List[Dict[str, str]],
        schema: Type[T],
        temperature: float = 0.2,
        mock_factory: Optional[callable] = None,
    ) -> T:
        """
        Calls NVIDIA Nemotron or uses local fallback to return a validated Pydantic model.
        """
        # Enforce application-level usage limits
        if self._call_count >= settings.max_model_calls:
            raise QuotaExceededError(
                f"Application-level limit reached: max {settings.max_model_calls} model calls per investigation."
            )

        # Check if we should execute mock mode
        if settings.effective_mock_mode:
            logger.info("Using local mock inference for Nemotron (safe zero-paid mode).")
            if mock_factory:
                return mock_factory()
            raise NemotronAPIError("Mock factory was not provided for mock mode.")

        # If live inference requested but no credentials, fail fast with explicit instructions
        if not settings.has_nebius_credentials:
            raise MissingCredentialsError(
                "NVIDIA Nemotron credentials missing: NEBIUS_API_KEY environment variable is not set. "
                "Provide a valid key in .env or set ALLOW_MOCK_FALLBACK=true for local UI development."
            )

        self._call_count += 1
        url = f"{settings.nebius_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.nebius_api_key}",
            "Content-Type": "application/json",
        }

        # Add schema instruction into system message
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        system_instruction = (
            f"You are Contra's adversarial research engine powered by NVIDIA Nemotron. "
            f"You must strictly output ONLY valid JSON complying with this JSON Schema:\n{schema_json}\n"
            f"Do not include any prose outside the JSON."
        )

        adjusted_messages = [
            {"role": "system", "content": system_instruction},
            *messages,
        ]

        payload = {
            "model": settings.nebius_model_id,
            "messages": adjusted_messages,
            "temperature": temperature,
            "max_tokens": settings.max_output_tokens,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=float(settings.investigation_timeout_seconds)) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
            except httpx.TimeoutException as exc:
                logger.error("Nemotron API timed out after %ss: %s", settings.investigation_timeout_seconds, exc)
                raise NemotronAPIError(
                    f"Nemotron API request timed out after {settings.investigation_timeout_seconds} seconds."
                ) from exc
            except httpx.RequestError as exc:
                logger.error("Network error communicating with Nemotron API: %s", exc)
                raise NemotronAPIError(f"Network error communicating with Nebius Token Factory: {exc}") from exc

        if response.status_code == 401 or response.status_code == 403:
            raise MissingCredentialsError(
                f"Nebius Token Factory authentication failed (HTTP {response.status_code}). Check your NEBIUS_API_KEY."
            )
        elif response.status_code == 429:
            raise NemotronAPIError(
                "Nebius Token Factory rate limit exceeded (HTTP 429). Please reduce query frequency or retry later."
            )
        elif response.status_code >= 400:
            raise NemotronAPIError(
                f"Nemotron API error (HTTP {response.status_code}): {response.text[:300]}"
            )

        try:
            data = response.json()
            raw_content = data["choices"][0]["message"]["content"]
            if not raw_content or not raw_content.strip():
                raise NemotronAPIError("Nemotron returned an empty response.")

            clean_json = self._clean_json_markdown(raw_content)
            parsed_dict = json.loads(clean_json)
            return schema.model_validate(parsed_dict)
        except (KeyError, IndexError, json.JSONDecodeError, ValidationError) as err:
            logger.error("Failed to parse or validate Nemotron structured output: %s", err)
            raise NemotronAPIError(
                f"Failed to validate Nemotron response against schema {schema.__name__}: {err}"
            ) from err


nemotron_service = NemotronService()
