"""
Commodity and location normalizer for MandiSaarthi.
Supports nationwide Indian agricultural commodities, location disambiguation,
and safe fallback normalization.
"""
from __future__ import annotations
import re

# Canonical commodity mappings (lowercase key -> Canonical Title)
# MVP core supported commodities
COMMODITY_MAP: dict[str, str] = {
    "wheat": "Wheat",
    "gehun": "Wheat",
    "gehu": "Wheat",
    "onion": "Onion",
    "pyaz": "Onion",
    "pyaj": "Onion",
    "kanda": "Onion",
    "tomato": "Tomato",
    "tamatar": "Tomato",
    "potato": "Potato",
    "aalu": "Potato",
    "aloo": "Potato",
    "alu": "Potato",
}

# Canonical name -> Hindi display name
COMMODITY_HINDI: dict[str, str] = {
    "Wheat": "गेहूँ",
    "Onion": "प्याज",
    "Tomato": "टमाटर",
    "Potato": "आलू",
    "Rice": "चावल",
    "Paddy(Dhan)": "धान",
    "Maize": "मक्का",
    "Gram": "चना",
    "Mustard": "सरसों",
    "Soyabean": "सोयाबीन",
    "Cotton": "कपास",
    "Sugarcane": "गन्ना",
    "Mango": "आम",
}


def normalize_commodity(name: str, allow_unmapped: bool = False) -> str:
    """
    Return the canonical commodity name for *name*.
    Lookup is case-insensitive.
    Raises ValueError if unknown and allow_unmapped is False.
    """
    if not name or not name.strip():
        raise ValueError("Commodity name cannot be empty")

    cleaned = name.strip()
    key = cleaned.lower()

    if key in COMMODITY_MAP:
        return COMMODITY_MAP[key]

    if allow_unmapped:
        return cleaned.title()

    raise ValueError(f"Unknown commodity: {name!r}")


def get_commodity_hindi(canonical_name: str) -> str:
    """Return Hindi name if available, otherwise return the canonical English name."""
    return COMMODITY_HINDI.get(canonical_name, canonical_name)


def normalize_location_name(name: str) -> str:
    """
    Clean and title-case a state, district, or mandi name.
    Removes extraneous spaces and standardizes punctuation.
    """
    if not name:
        return ""
    cleaned = re.sub(r"\s+", " ", name.strip())
    return cleaned.title()


def normalize_district(district: str) -> str:
    """Alias for backwards compatibility."""
    return normalize_location_name(district)


def format_district_disambiguated(district: str, state: str) -> str:
    """Format district with state to prevent cross-state naming collisions."""
    d = normalize_location_name(district)
    s = normalize_location_name(state)
    return f"{d}, {s}" if s else d
