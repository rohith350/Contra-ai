"""
Real evidence web retrieval service.
Uses ddgs (DuckDuckGo) with fallback extraction to retrieve verified search results.
Never invents sources or URLs. Enforces zero-paid rate limits and query bounds.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from backend.config import settings

logger = logging.getLogger(__name__)

# Attempt to import ddgs or duckduckgo_search
try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS  # type: ignore
    except ImportError:
        DDGS = None  # type: ignore


class SearchResultItem:
    def __init__(self, title: str, snippet: str, url: str, source_name: str):
        self.title = title
        self.snippet = snippet
        self.url = url
        self.source_name = source_name

    def to_dict(self) -> Dict[str, str]:
        return {
            "title": self.title,
            "snippet": self.snippet,
            "url": self.url,
            "source_name": self.source_name,
        }


class SearchService:
    def __init__(self):
        self._search_count = 0

    def reset_counter(self):
        self._search_count = 0

    def _extract_source_name(self, url: str) -> str:
        try:
            domain = urlparse(url).netloc
            if domain.startswith("www."):
                domain = domain[4:]
            return domain or "Web Source"
        except Exception:
            return "Web Source"

    async def search(self, query: str, max_results: Optional[int] = None) -> List[SearchResultItem]:
        """
        Executes a real web search query and returns verified items.
        """
        if self._search_count >= settings.max_search_queries:
            logger.warning(
                "Search query limit (%d) reached. Skipping additional queries.",
                settings.max_search_queries,
            )
            return []

        limit = max_results or settings.max_results_per_query
        self._search_count += 1
        results: List[SearchResultItem] = []

        if DDGS is None:
            logger.warning("ddgs library not installed, returning empty search results.")
            return []

        def _fetch_sync():
            try:
                ddgs_client = DDGS()
                return list(ddgs_client.text(query, max_results=limit))
            except Exception as exc:
                logger.warning("DuckDuckGo sync query error for '%s': %s", query, exc)
                return []

        try:
            raw_results = await asyncio.wait_for(
                asyncio.to_thread(_fetch_sync),
                timeout=6.0,
            )
            for item in raw_results:
                title = item.get("title") or ""
                body = item.get("body") or item.get("snippet") or ""
                href = item.get("href") or item.get("url") or ""
                if not href or not title:
                    continue

                source_name = self._extract_source_name(href)
                results.append(
                    SearchResultItem(
                        title=title.strip(),
                        snippet=body.strip(),
                        url=href.strip(),
                        source_name=source_name,
                    )
                )
        except asyncio.TimeoutError:
            logger.warning("Search query '%s' timed out after 6.0s.", query)
            return []
        except Exception as e:
            logger.error("Web search failed for query '%s': %s", query, e)
            return []

        return results


search_service = SearchService()
