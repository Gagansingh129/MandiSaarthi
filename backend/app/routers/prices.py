"""
prices.py — router for price query endpoints.
Mounted at /api/v1/prices in main.py.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.services import data_resolver
from app.models.schemas import (
    LatestResponse,
    MandiLatestResult,
    HistoryResponse,
    HistoryEntry,
)
from app.utils.normalizer import normalize_commodity, normalize_district

router = APIRouter(tags=["prices"])


def _parse_latest_params(
    commodity: str,
    district: str,
    state: Optional[str],
) -> tuple[str, str, Optional[str]]:
    """Validate and normalise commodity + district query params."""
    try:
        canonical_commodity = normalize_commodity(commodity)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Unknown commodity: {commodity!r}")
    canonical_district = normalize_district(district)
    canonical_state = state.strip().title() if state else None
    return canonical_commodity, canonical_district, canonical_state


@router.get("/latest", response_model=LatestResponse)
async def get_latest(
    commodity: str = Query(..., description="Commodity name (e.g. Wheat)"),
    district: str = Query(..., description="District name"),
    state: Optional[str] = Query(None, description="State name (optional)"),
) -> LatestResponse:
    """
    Return the most-recent price for each mandi in the given district/commodity.
    """
    canonical_commodity, canonical_district, canonical_state = _parse_latest_params(
        commodity, district, state
    )

    rows = await data_resolver.get_latest(
        commodity=canonical_commodity,
        district=canonical_district,
        state=canonical_state,
    )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No data found for commodity={canonical_commodity!r}, "
                f"district={canonical_district!r}"
                + (f", state={canonical_state!r}" if canonical_state else "")
            ),
        )

    results = [MandiLatestResult(**r) for r in rows]
    return LatestResponse(
        commodity=canonical_commodity,
        district=canonical_district,
        state=canonical_state or "",
        query_date=date.today().isoformat(),
        results=results,
    )


@router.get("/compare", response_model=LatestResponse)
async def compare_latest(
    commodity: str = Query(..., description="Commodity name (e.g. Wheat)"),
    district: str = Query(..., description="District name"),
    state: Optional[str] = Query(None, description="State name (optional)"),
) -> LatestResponse:
    """
    Compare latest prices across mandis in a district.
    (Same as /latest — separate endpoint for semantic clarity on the frontend.)
    """
    canonical_commodity, canonical_district, canonical_state = _parse_latest_params(
        commodity, district, state
    )

    rows = await data_resolver.get_latest(
        commodity=canonical_commodity,
        district=canonical_district,
        state=canonical_state,
    )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No data found for commodity={canonical_commodity!r}, "
                f"district={canonical_district!r}"
                + (f", state={canonical_state!r}" if canonical_state else "")
            ),
        )

    results = [MandiLatestResult(**r) for r in rows]
    return LatestResponse(
        commodity=canonical_commodity,
        district=canonical_district,
        state=canonical_state or "",
        query_date=date.today().isoformat(),
        results=results,
    )


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    commodity: str = Query(..., description="Commodity name (e.g. Wheat)"),
    mandi: str = Query(..., description="Mandi name"),
    days: int = Query(7, ge=1, le=30, description="Number of days (1-30, default 7)"),
) -> HistoryResponse:
    """
    Return a day-by-day price history for the given mandi and commodity.
    Missing dates are returned with modal_price=null, no_rate_reported=true.
    """
    try:
        canonical_commodity = normalize_commodity(commodity)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Unknown commodity: {commodity!r}")

    rows = await data_resolver.get_history(
        commodity=canonical_commodity,
        mandi=mandi.strip(),
        days=days,
    )

    # If every entry is a gap (no data at all for this mandi), return 404
    all_missing = all(r["modal_price"] is None and r["no_rate_reported"] for r in rows)
    # Check if there's actually any row for this mandi in the CSV at all
    from app.services.csv_store import _require_df
    df = _require_df()
    mandi_exists = not df[df["mandi"].str.lower() == mandi.strip().lower()].empty
    if not mandi_exists:
        raise HTTPException(status_code=404, detail=f"No data found for mandi={mandi!r}")

    history = [HistoryEntry(**r) for r in rows]
    return HistoryResponse(
        mandi=mandi.strip(),
        commodity=canonical_commodity,
        days=days,
        history=history,
    )
