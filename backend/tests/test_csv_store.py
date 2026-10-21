"""
test_csv_store.py — unit tests for the csv_store module.
"""
from __future__ import annotations

from datetime import date

import pytest

import app.services.csv_store as csv_store


@pytest.fixture(autouse=True, scope="module")
def preload() -> None:
    """Load the CSV store once for all tests in this module."""
    csv_store.load()


class TestLoad:
    def test_load_returns_positive_row_count(self) -> None:
        assert csv_store.row_count() > 0


class TestGetCommodities:
    def test_get_commodities_returns_list(self) -> None:
        result = csv_store.get_commodities()
        assert isinstance(result, list)
        assert len(result) > 0
        for item in result:
            assert "name" in item
            assert "name_hi" in item
            assert item["name"]  # non-empty


class TestGetDistricts:
    def test_get_districts_filters_by_commodity(self) -> None:
        result = csv_store.get_districts("Wheat")
        assert isinstance(result, list)
        assert len(result) > 0
        for item in result:
            assert "district" in item
            assert "state" in item

    def test_get_districts_unknown_commodity_returns_empty(self) -> None:
        result = csv_store.get_districts("Mango")
        assert result == []


class TestGetLatest:
    def test_get_latest_returns_most_recent_date(self) -> None:
        """The returned rows should be for the maximum available reported_date."""
        results = csv_store.get_latest("Wheat", "Agra", "Uttar Pradesh")
        assert len(results) > 0
        # All rows must share the same (most recent) reported_date per mandi
        for r in results:
            # The date should be parseable
            d = date.fromisoformat(r["reported_date"])
            assert isinstance(d, date)

    def test_get_latest_sets_is_stale_correctly(self) -> None:
        results = csv_store.get_latest("Wheat", "Agra", "Uttar Pradesh")
        today = date.today()
        for r in results:
            rep = date.fromisoformat(r["reported_date"])
            expected_stale = rep < today
            assert r["is_stale"] == expected_stale, (
                f"is_stale mismatch for {r['mandi']}: "
                f"reported={rep}, today={today}, got is_stale={r['is_stale']}"
            )

    def test_get_latest_unknown_returns_empty(self) -> None:
        results = csv_store.get_latest("Wheat", "NonExistentDistrict", None)
        assert results == []

    def test_no_rate_row_has_null_modal_price(self) -> None:
        """If the latest row for a mandi is no_rate_reported, modal_price must be None."""
        results = csv_store.get_latest("Wheat", "Agra", "Uttar Pradesh")
        for r in results:
            if r["no_rate_reported"]:
                assert r["modal_price"] is None, (
                    f"Mandi {r['mandi']} has no_rate_reported=True but modal_price={r['modal_price']}"
                )


class TestGetHistory:
    def test_get_history_length_equals_days(self) -> None:
        result = csv_store.get_history("Wheat", "Agra Grain Market", 7)
        assert len(result) == 7

    def test_get_history_fills_gaps_with_null(self) -> None:
        """Dates missing from CSV must appear with modal_price=None, no_rate_reported=True."""
        result = csv_store.get_history("Wheat", "Agra Grain Market", 30)
        assert len(result) == 30
        for entry in result:
            if entry["no_rate_reported"]:
                assert entry["modal_price"] is None, (
                    f"Gap on {entry['date']} has modal_price={entry['modal_price']}"
                )

    def test_history_no_rate_reported_row_null_price(self) -> None:
        """Rows where no_rate_reported=True in the CSV must surface as modal_price=None."""
        # Row for 2026-10-18 in Agra Grain Market Wheat has no_rate_reported=true
        result = csv_store.get_history("Wheat", "Agra Grain Market", 7)
        by_date = {e["date"]: e for e in result}
        if "2026-10-18" in by_date:
            entry = by_date["2026-10-18"]
            assert entry["modal_price"] is None
            assert entry["no_rate_reported"] is True
