"""
test_data_sync_and_resilience.py — tests for:
  • Atomic CSV updates
  • Duplicate handling and conflict resolution
  • District disambiguation across states
  • Seamless fallback to CSV when API fails
  • Endpoints: /api/v1/data/status, /api/v1/data/refresh, /api/v1/meta/states, /api/v1/meta/mandis
"""
from __future__ import annotations

import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import csv_store, data_resolver
from app.utils.normalizer import format_district_disambiguated


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_atomic_csv_updates_and_tempfile_cleanup():
    """Verify that atomic_ingest_records writes atomically and cleans up temp files."""
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    # Initialize with clean data
    csv_store.load()
    initial_records = [
        {
            "state": "Haryana",
            "district": "Karnal",
            "mandi": "Karnal Grain Market",
            "commodity": "Wheat",
            "commodity_hindi": "गेहूँ",
            "variety": "Lokwan",
            "min_price": 2000.0,
            "max_price": 2300.0,
            "modal_price": 2150.0,
            "price_unit": "INR/Quintal",
            "reported_date": "2026-10-21",
            "source": "Agmarknet",
            "no_rate_reported": False,
        }
    ]

    try:
        updated = csv_store.atomic_ingest_records(initial_records, target_path=tmp_path)
        assert updated == 1
        assert tmp_path.exists()

        # Ensure no dangling .tmp files in the directory
        dangling_tmps = list(tmp_path.parent.glob(f"{tmp_path.name}.tmp.*"))
        assert len(dangling_tmps) == 0

        # Read back and verify row was saved
        with open(tmp_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "Karnal Grain Market" in content
            assert "2150.00" in content

    finally:
        if tmp_path.exists():
            tmp_path.unlink()
        # Reload default store
        csv_store.load()


def test_duplicate_and_conflict_resolution():
    """Verify duplicate records with different prices resolve to the newest price."""
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        # Load baseline
        csv_store.load()

        # Two records with exact same (state, district, mandi, commodity, date)
        record_old = {
            "state": "Gujarat",
            "district": "Surat",
            "mandi": "Surat APMC",
            "commodity": "Onion",
            "commodity_hindi": "प्याज",
            "variety": "Red",
            "min_price": 1000.0,
            "max_price": 1400.0,
            "modal_price": 1200.0,
            "price_unit": "INR/Quintal",
            "reported_date": "2026-10-21",
            "source": "Agmarknet",
            "no_rate_reported": False,
        }
        record_new = {
            **record_old,
            "modal_price": 1350.0,  # updated price
        }

        csv_store.atomic_ingest_records([record_old], target_path=tmp_path)
        csv_store.atomic_ingest_records([record_new], target_path=tmp_path)

        with open(tmp_path, "r", encoding="utf-8") as f:
            content = f.read()
            # Must contain the new price, and Surat APMC must appear only once in the records
            assert "1350.00" in content
            assert content.count("Surat APMC") == 1

    finally:
        if tmp_path.exists():
            tmp_path.unlink()
        csv_store.load()


def test_district_disambiguation_cross_states():
    """Verify cross-state district name disambiguation helper."""
    d1 = format_district_disambiguated("aurangabad", "maharashtra")
    d2 = format_district_disambiguated("aurangabad", "bihar")
    d3 = format_district_disambiguated("bilaspur", "chhattisgarh")
    d4 = format_district_disambiguated("bilaspur", "himachal pradesh")

    assert d1 == "Aurangabad, Maharashtra"
    assert d2 == "Aurangabad, Bihar"
    assert d1 != d2
    assert d3 == "Bilaspur, Chhattisgarh"
    assert d4 == "Bilaspur, Himachal Pradesh"


def test_data_status_endpoint(client: TestClient):
    """Verify /api/v1/data/status provides complete diagnostics without leaking keys."""
    resp = client.get("/api/v1/data/status")
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "ok"
    assert "data_source" in data
    assert "api_key_configured" in data
    assert "total_records" in data
    assert "unique_states" in data
    assert "unique_commodities" in data
    assert data["total_records"] > 0

    # Ensure no raw secret is leaked
    masked = data.get("masked_key")
    if masked:
        assert "..." in masked


def test_states_endpoint(client: TestClient):
    """Verify /api/v1/meta/states returns available states."""
    resp = client.get("/api/v1/meta/states")
    assert resp.status_code == 200
    data = resp.json()
    assert "states" in data
    assert len(data["states"]) > 0
    assert "Uttar Pradesh" in data["states"]


def test_mandis_endpoint(client: TestClient):
    """Verify /api/v1/meta/mandis returns mandis for commodity & district."""
    resp = client.get("/api/v1/meta/mandis", params={"commodity": "Wheat", "district": "Agra"})
    assert resp.status_code == 200
    data = resp.json()
    assert "mandis" in data
    assert len(data["mandis"]) > 0
    assert "Agra Grain Market" in data["mandis"]


@pytest.mark.asyncio
async def test_fallback_when_api_fails():
    """Verify data_resolver seamlessly falls back to CSV when live API raises."""
    with patch("app.services.agmarknet.fetch_agmarknet_records", side_effect=RuntimeError("API Network Drop")):
        # Request data for Wheat in Agra
        records = await data_resolver.get_latest(
            commodity="Wheat",
            district="Agra",
            state="Uttar Pradesh",
        )
        assert len(records) > 0
        assert records[0]["mandi"] == "Agra Grain Market"
        assert data_resolver.get_source() == "csv"
