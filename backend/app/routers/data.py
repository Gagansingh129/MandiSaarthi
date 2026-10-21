"""
data.py — router for data sync, diagnostics, and refresh operations.
Mounted at /api/v1/data in main.py.
"""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Query

from app.models.schemas import DataStatusResponse, RefreshResponse
from app.services import data_resolver

router = APIRouter(tags=["data"])


@router.get("/status", response_model=DataStatusResponse)
def get_data_status() -> DataStatusResponse:
    """
    Return comprehensive diagnostics regarding data source, API key configuration,
    offline cache, and metadata provenance without revealing secrets.
    """
    diag = data_resolver.get_diagnostics()
    return DataStatusResponse(**diag)


@router.post("/refresh", response_model=RefreshResponse)
async def trigger_refresh(
    commodity: Optional[str] = Query(None, description="Optional commodity filter to sync"),
    district: Optional[str] = Query(None, description="Optional district filter"),
    state: Optional[str] = Query(None, description="Optional state filter"),
) -> RefreshResponse:
    """
    Trigger an on-demand market rate refresh from the official Agmarknet API.
    If the API call fails or no API key is present, retains the existing verified
    dataset safely.
    """
    result = await data_resolver.refresh_market_data(
        commodity=commodity,
        district=district,
        state=state,
    )
    return RefreshResponse(**result)
