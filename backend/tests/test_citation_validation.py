"""
Tests for citation validation and anti-hallucination guards.
Verifies that all evidence receipts contain verified URLs, source names, excerpts, and methodology.
"""

from urllib.parse import urlparse
import pytest
from pydantic import ValidationError
from backend.models.schemas import EvidenceReceipt, StanceType
from backend.services.search_service import search_service


def test_evidence_receipt_validation():
    """Verify that EvidenceReceipt model validates presence of required fields."""
    valid_receipt = EvidenceReceipt(
        id="r-101",
        title="Comprehensive Lifecycle Analysis of Battery Electric Vehicles",
        sourceName="Argonne National Laboratory",
        url="https://greet.es.anl.gov/publication-greet-2024",
        date="2024-01-15",
        stance=StanceType.SUPPORTING,
        excerpt="Manufacturing emissions represent 38% of total vehicle production footprint.",
        methodologyNotes="Full supply-chain material lifecycle simulation.",
        limitations="Sensitive to raw material origin.",
    )

    assert valid_receipt.id == "r-101"
    parsed_url = urlparse(valid_receipt.url)
    assert parsed_url.scheme in ("http", "https")
    assert parsed_url.netloc != ""


def test_invalid_evidence_receipt_fails():
    """Verify that an EvidenceReceipt with missing fields raises ValidationError."""
    with pytest.raises(ValidationError):
        # Missing required fields like url, excerpt, stance
        EvidenceReceipt.model_validate({"id": "r-broken", "title": "Incomplete"})


def test_search_service_domain_extraction():
    """Verify that search service extracts clean domain names from URLs."""
    assert search_service._extract_source_name("https://www.nature.com/articles/s41560") == "nature.com"
    assert search_service._extract_source_name("https://theicct.org/publications") == "theicct.org"
    assert search_service._extract_source_name("https://greet.es.anl.gov/index") == "greet.es.anl.gov"
