import os
import json
import httpx
from typing import List, Dict, Any

API_KEY = os.getenv("TAVILY_API_KEY")
BASE_URL = os.getenv("TAVILY_ENDPOINT", "https://api.tavily.com/search")
MAX_RESULTS = int(os.getenv("TAVILY_MAX_RESULTS", "5"))
TIMEOUT = int(os.getenv("TAVILY_TIMEOUT_SECONDS", "30"))

if not API_KEY:
    raise RuntimeError("TAVILY_API_KEY environment variable is not set")

_headers = {"Content-Type": "application/json", "x-api-key": API_KEY}

async def search(query: str) -> List[Dict[str, Any]]:
    """Perform a search via Tavily and return a list of source dictionaries.
    Each source dict may contain `url`, `title`, `excerpt`, `published_date`.
    """
    payload = {
        "query": query,
        "max_results": MAX_RESULTS,
        "search_depth": "basic",
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(BASE_URL, headers=_headers, json=payload)
        response.raise_for_status()
        data = response.json()
        # Tavily returns a top‑level "results" list
        return data.get("results", [])
