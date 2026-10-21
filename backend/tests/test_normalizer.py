"""
test_normalizer.py — unit tests for commodity / district name normalisation.
"""
from __future__ import annotations

import pytest

from app.utils.normalizer import normalize_commodity, normalize_district


class TestNormalizeCommodity:
    def test_known_commodities_normalize(self) -> None:
        cases = {
            "wheat": "Wheat",
            "Wheat": "Wheat",
            "WHEAT": "Wheat",
            "gehun": "Wheat",
            "gehu": "Wheat",
            "onion": "Onion",
            "Onion": "Onion",
            "pyaz": "Onion",
            "pyaj": "Onion",
            "kanda": "Onion",
            "tomato": "Tomato",
            "Tomato": "Tomato",
            "tamatar": "Tomato",
            "potato": "Potato",
            "Potato": "Potato",
            "aalu": "Potato",
            "aloo": "Potato",
            "alu": "Potato",
        }
        for raw, expected in cases.items():
            assert normalize_commodity(raw) == expected, f"Failed for input {raw!r}"

    def test_unknown_commodity_raises(self) -> None:
        with pytest.raises(ValueError):
            normalize_commodity("mango")

        with pytest.raises(ValueError):
            normalize_commodity("")

        with pytest.raises(ValueError):
            normalize_commodity("rice")


class TestNormalizeDistrict:
    def test_district_title_cased(self) -> None:
        assert normalize_district("agra") == "Agra"
        assert normalize_district("LUCKNOW") == "Lucknow"
        assert normalize_district("new delhi") == "New Delhi"
        assert normalize_district("  amritsar  ") == "Amritsar"
