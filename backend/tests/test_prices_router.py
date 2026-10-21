"""
test_prices_router.py — integration tests for the FastAPI price endpoints.

Uses FastAPI TestClient with the bundled cleaned CSV (FORCE_CSV_MODE=True).
"""
from __future__ import annotations

import os
from datetime import date

# Ensure CSV mode before importing the app
os.environ.setdefault("FORCE_CSV_MODE", "true")

import pytest
from fastapi.testclient import TestClient

from app.main import app, lifespan
from app.services import csv_store


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Create a test client with the lifespan (startup CSV load) triggered."""
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class TestHealth:
    def test_health_endpoint(self, client: TestClient) -> None:
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["csv_rows"] > 0
        assert "data_source" in data


# ---------------------------------------------------------------------------
# Meta — commodities
# ---------------------------------------------------------------------------


class TestGetCommodities:
    def test_get_commodities(self, client: TestClient) -> None:
        resp = client.get("/api/v1/meta/commodities")
        assert resp.status_code == 200
        data = resp.json()
        assert "commodities" in data
        names = [c["name"] for c in data["commodities"]]
        assert "Wheat" in names

    def test_commodities_have_hindi_names(self, client: TestClient) -> None:
        resp = client.get("/api/v1/meta/commodities")
        for item in resp.json()["commodities"]:
            assert item["name_hi"], f"Missing Hindi name for {item['name']}"


# ---------------------------------------------------------------------------
# Meta — districts
# ---------------------------------------------------------------------------


class TestGetDistricts:
    def test_get_districts_for_wheat(self, client: TestClient) -> None:
        resp = client.get("/api/v1/meta/districts", params={"commodity": "Wheat"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["commodity"] == "Wheat"
        assert len(data["districts"]) > 0
        # Each entry must have district and state
        for d in data["districts"]:
            assert "district" in d
            assert "state" in d

    def test_get_districts_unknown_commodity_returns_404(self, client: TestClient) -> None:
        resp = client.get("/api/v1/meta/districts", params={"commodity": "Mango"})
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Prices — latest
# ---------------------------------------------------------------------------


class TestGetLatest:
    def test_get_latest_valid(self, client: TestClient) -> None:
        resp = client.get(
            "/api/v1/prices/latest",
            params={"commodity": "Wheat", "district": "Agra", "state": "Uttar Pradesh"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["commodity"] == "Wheat"
        assert data["district"] == "Agra"
        assert len(data["results"]) > 0
        for r in data["results"]:
            assert "mandi" in r
            assert "reported_date" in r
            assert "is_stale" in r
            assert "no_rate_reported" in r
            assert "source" in r

    def test_get_latest_unknown_commodity_returns_404(self, client: TestClient) -> None:
        resp = client.get(
            "/api/v1/prices/latest",
            params={"commodity": "Mango", "district": "Agra"},
        )
        assert resp.status_code == 404

    def test_get_latest_unknown_district_returns_404(self, client: TestClient) -> None:
        resp = client.get(
            "/api/v1/prices/latest",
            params={"commodity": "Wheat", "district": "NonExistentPlace"},
        )
        assert resp.status_code == 404

    def test_is_stale_flag(self, client: TestClient) -> None:
        """is_stale must reflect whether reported_date < today."""
        resp = client.get(
            "/api/v1/prices/latest",
            params={"commodity": "Wheat", "district": "Agra"},
        )
        assert resp.status_code == 200
        today = date.today()
        for r in resp.json()["results"]:
            rep = date.fromisoformat(r["reported_date"])
            expected = rep < today
            assert r["is_stale"] == expected, (
                f"is_stale mismatch: reported={rep}, today={today}, got={r['is_stale']}"
            )


# ---------------------------------------------------------------------------
# Prices — history
# ---------------------------------------------------------------------------


class TestGetHistory:
    def test_get_history_length(self, client: TestClient) -> None:
        resp = client.get(
            "/api/v1/prices/history",
            params={"commodity": "Wheat", "mandi": "Agra Grain Market", "days": 7},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["days"] == 7
        assert len(data["history"]) == 7

    def test_get_history_gap_is_null(self, client: TestClient) -> None:
        """Entries with no_rate_reported=True must have modal_price=null."""
        resp = client.get(
            "/api/v1/prices/history",
            params={"commodity": "Wheat", "mandi": "Agra Grain Market", "days": 7},
        )
        assert resp.status_code == 200
        for entry in resp.json()["history"]:
            if entry["no_rate_reported"]:
                assert entry["modal_price"] is None, (
                    f"Expected null modal_price for gap on {entry['date']}"
                )

    def test_get_history_unknown_mandi_returns_404(self, client: TestClient) -> None:
        resp = client.get(
            "/api/v1/prices/history",
            params={"commodity": "Wheat", "mandi": "Ghost Mandi XYZ", "days": 7},
        )
        assert resp.status_code == 404

    def test_get_history_days_capped_at_30(self, client: TestClient) -> None:
        """Requesting more than 30 days should return a 422 validation error."""
        resp = client.get(
            "/api/v1/prices/history",
            params={"commodity": "Wheat", "mandi": "Agra Grain Market", "days": 31},
        )
        assert resp.status_code == 422
