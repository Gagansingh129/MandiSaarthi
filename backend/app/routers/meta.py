"""
meta.py — router for commodity, state, district, and market metadata endpoints.
Mounted at /api/v1/meta in main.py.
"""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.services import csv_store
from app.models.schemas import (
    CommoditiesResponse,
    CommodityItem,
    DistrictsResponse,
    DistrictItem,
    StatesResponse,
    MandisResponse,
)
from app.utils.normalizer import normalize_commodity, normalize_district

router = APIRouter(tags=["meta"])


@router.get("/commodities", response_model=CommoditiesResponse)
def list_commodities() -> CommoditiesResponse:
    """Return distinct commodities with Hindi names from the dataset."""
    items = csv_store.get_commodities()
    return CommoditiesResponse(
        commodities=[CommodityItem(name=i["name"], name_hi=i["name_hi"]) for i in items]
    )


@router.get("/states", response_model=StatesResponse)
def list_states(
    commodity: Optional[str] = Query(None, description="Optional commodity filter"),
) -> StatesResponse:
    """Return distinct available states, optionally filtered by commodity."""
    canonical = None
    if commodity:
        try:
            canonical = normalize_commodity(commodity)
        except Exception:
            canonical = commodity
    states = csv_store.get_states(commodity=canonical)
    return StatesResponse(states=states)


@router.get("/districts", response_model=DistrictsResponse)
def list_districts(
    commodity: str = Query(..., description="Commodity name (e.g. Wheat)"),
    state: Optional[str] = Query(None, description="Optional state name to disambiguate or filter"),
) -> DistrictsResponse:
    """
    Return distinct districts + states for a given commodity, optionally filtered by state.
    """
    try:
        canonical = normalize_commodity(commodity)
    except Exception:
        canonical = commodity

    items = csv_store.get_districts(commodity=canonical, state=state)
    if not items:
        # Check if commodity exists in store at all
        commodities_available = [c["name"].lower() for c in csv_store.get_commodities()]
        if canonical.lower() not in commodities_available:
            raise HTTPException(status_code=404, detail=f"Unknown commodity: {commodity!r}")

    return DistrictsResponse(
        commodity=canonical,
        districts=[DistrictItem(district=i["district"], state=i["state"]) for i in items],
    )


@router.get("/mandis", response_model=MandisResponse)
def list_mandis(
    commodity: str = Query(..., description="Commodity name (e.g. Wheat)"),
    district: str = Query(..., description="District name"),
    state: Optional[str] = Query(None, description="Optional state name"),
) -> MandisResponse:
    """Return available mandis in the given commodity & district."""
    try:
        canonical_comm = normalize_commodity(commodity)
    except Exception:
        canonical_comm = commodity

    canonical_dist = normalize_district(district)
    mandis = csv_store.get_mandis(commodity=canonical_comm, district=canonical_dist, state=state)

    return MandisResponse(
        commodity=canonical_comm,
        district=canonical_dist,
        state=state,
        mandis=mandis,
    )
