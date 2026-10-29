import os
import json
from typing import Any, Dict
import httpx

# Nebius / Nemotron client
# Reads NEBIUS_API_KEY and NEBIUS_ENDPOINT from environment (no secrets are printed).

API_KEY = os.getenv("NEBIUS_API_KEY")
BASE_URL = os.getenv("NEBIUS_ENDPOINT", "https://api.nebious.ai/v1")
MODEL_ID = os.getenv("NEBIUS_MODEL_ID", "nemotron-340b-instruct")
TIMEOUT = int(os.getenv("NEBIUS_TIMEOUT_SECONDS", "30"))

if not API_KEY:
    # The client will raise a clear error when used if the key is missing.
    raise RuntimeError("NEBIUS_API_KEY environment variable is not set")

_headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

async def call_model(prompt: str) -> Dict[str, Any]:
    """Send a prompt to the Nemotron model via Nebius and return the parsed JSON response.

    The Nebius API expects a JSON payload like:
    {
        "model": "<model-id>",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 1024,
        "response_format": {"type": "json_object"}
    }

    The function returns the decoded JSON object (or raises on error)."""
    payload = {
        "model": MODEL_ID,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 1024,
        "response_format": {"type": "json_object"},
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(f"{BASE_URL}/chat/completions", headers=_headers, json=payload)
        response.raise_for_status()
        data = response.json()
        # Nebius returns `choices[0].message.content` as a string – attempt to parse it as JSON.
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Nebius model returned non‑JSON content: {content}") from exc
