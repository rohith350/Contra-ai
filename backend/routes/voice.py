"""
Voice Chat API endpoint for Contra AI.
Accepts a user message and conversation history, calls NVIDIA Nemotron via OpenAI-compatible
chat completions, and returns a clean, plain-text response suitable for TTS audio synthesis.
"""

from __future__ import annotations

import logging
import re
import time
from typing import List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.config import settings

logger = logging.getLogger("contra-voice")

router = APIRouter(prefix="/api/voice", tags=["Voice"])

VOICE_SYSTEM_PROMPT = (
    "You are Contra AI, a research assistant powered by NVIDIA Nemotron. "
    "Respond in 1 to 2 spoken conversational sentences. "
    "Be direct and helpful. Do not output any thought process or constraints. Provide only your spoken response."
)

MOCK_RESPONSES = [
    "I'm listening. Contra AI is active and ready to test or challenge your hypothesis.",
    "Interesting claim. Initial evidence suggests nuanced trade-offs worth examining further.",
    "I can hear you clearly. What premise or hypothesis would you like to investigate today?",
    "Empirical data in that area shows significant variance. Let me know what specific causal question you have.",
    "System online. NVIDIA Nemotron voice synthesis is operational and ready.",
]

_mock_response_index = 0


class VoiceMessage(BaseModel):
    role: str = Field(description="'user' or 'assistant'")
    content: str


class VoiceChatRequest(BaseModel):
    message: str = Field(description="Latest user utterance")
    history: List[VoiceMessage] = Field(
        default_factory=list,
        description="Prior conversation turns (excluding the current message)",
    )


class VoiceChatResponse(BaseModel):
    response: str = Field(description="Plain-text AI response for TTS playback")
    mock: bool = Field(description="True if this was a mock/fallback response")


def _extract_plain_text(choice: dict) -> str:
    """
    Safely extracts plain conversational text from an OpenAI/NVIDIA API choice dictionary.
    Handles models with 'content', 'reasoning_content', or draft tokens.
    """
    message = choice.get("message", {})
    content = message.get("content")

    if content and isinstance(content, str) and content.strip():
        # Remove any stray <think>...</think> or markdown artifacts
        cleaned = re.sub(r"<think>[\s\S]*?</think>", "", content)
        cleaned = re.sub(r"[*_`#>]", "", cleaned).strip()
        if cleaned:
            return cleaned

    # Fallback: check reasoning_content or reasoning if content was null/truncated
    reasoning = message.get("reasoning_content") or message.get("reasoning") or ""
    if reasoning and isinstance(reasoning, str):
        # Look for draft response patterns often produced in reasoning
        draft_match = re.search(r'(?:Draft Response|Final Response|Response):\s*["\']?([^"\']+)["\']?', reasoning, re.IGNORECASE)
        if draft_match:
            return draft_match.group(1).strip()
        # Take the last meaningful sentence from reasoning if available
        sentences = [s.strip() for s in reasoning.split("\n") if s.strip() and not s.startswith(("#", "-", "*", "1.", "2."))]
        if sentences:
            last_line = sentences[-1]
            if len(last_line) > 10:
                return last_line

    return ""


@router.post(
    "/chat",
    response_model=VoiceChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a voice message and receive a Nemotron text response",
)
async def voice_chat(payload: VoiceChatRequest):
    """
    Accepts a user voice utterance (already transcribed to text) and prior conversation history.
    Calls NVIDIA Nemotron endpoint with safe token budgets and clean text extraction.
    """
    global _mock_response_index

    trimmed = payload.message.strip()
    if not trimmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message must not be empty.",
        )

    # If mock mode is explicitly requested or no credentials configured
    if settings.mock_mode or not settings.has_nebius_credentials:
        if settings.allow_mock_fallback:
            mock_text = MOCK_RESPONSES[_mock_response_index % len(MOCK_RESPONSES)]
            _mock_response_index += 1
            logger.info("Voice chat: mock response returned (no credentials or mock_mode).")
            return VoiceChatResponse(response=mock_text, mock=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="NVIDIA API key not configured and mock fallback is disabled.",
        )

    # Build conversation payload
    messages: list[dict[str, str]] = [
        {"role": "system", "content": VOICE_SYSTEM_PROMPT}
    ]
    for turn in payload.history[-6:]:
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": trimmed})

    url = f"{settings.nebius_base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.nebius_api_key}",
        "Content-Type": "application/json",
    }
    request_payload = {
        "model": settings.nebius_model_id,
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": 512,
    }

    start_time = time.time()
    try:
        import httpx

        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(url, headers=headers, json=request_payload)

        elapsed = round(time.time() - start_time, 2)
        logger.info(
            "Voice chat upstream request: status=%d, model=%s, elapsed=%ss",
            response.status_code,
            settings.nebius_model_id,
            elapsed,
        )

        if response.status_code in (401, 403):
            logger.error("NVIDIA API authentication failure: HTTP %d", response.status_code)
            if settings.allow_mock_fallback:
                mock_text = MOCK_RESPONSES[_mock_response_index % len(MOCK_RESPONSES)]
                _mock_response_index += 1
                return VoiceChatResponse(response=mock_text, mock=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="NVIDIA API authentication failed. Please verify your NEBIUS_API_KEY in .env.",
            )

        if response.status_code >= 400:
            error_preview = response.text[:200]
            logger.error("NVIDIA API upstream error: HTTP %d: %s", response.status_code, error_preview)
            if settings.allow_mock_fallback:
                mock_text = MOCK_RESPONSES[_mock_response_index % len(MOCK_RESPONSES)]
                _mock_response_index += 1
                return VoiceChatResponse(response=mock_text, mock=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"NVIDIA API error (HTTP {response.status_code}).",
            )

        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            raise ValueError("No choices returned from model")

        extracted_text = _extract_plain_text(choices[0])
        if not extracted_text:
            extracted_text = "I received your message. How can I help you test your hypothesis?"

        logger.info("Voice chat: Nemotron response generated successfully (%d chars).", len(extracted_text))
        return VoiceChatResponse(response=extracted_text, mock=False)

    except httpx.TimeoutException:
        logger.warning("Voice chat request timed out after 25s.")
        if settings.allow_mock_fallback:
            return VoiceChatResponse(
                response="Nemotron is taking a moment to respond. How else can I assist with your hypothesis?",
                mock=True,
            )
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="NVIDIA Nemotron request timed out.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Voice chat unhandled exception: %s", exc, exc_info=True)
        if settings.allow_mock_fallback:
            return VoiceChatResponse(
                response="System online. I'm ready to evaluate your claim.",
                mock=True,
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error processing voice message.",
        )
