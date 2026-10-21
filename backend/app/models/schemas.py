"""
Pydantic v2 response schemas for MandiSaarthi API.
"""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class CommodityItem(BaseModel):
    name: str
    name_hi: str


class DistrictItem(BaseModel):
    district: str
    state: str


class MandiLatestResult(BaseModel):
    mandi: str
    modal_price: Optional[float]
    min_price: Optional[float]
    max_price: Optional[float]
    price_unit: str
    reported_date: str  # ISO date string "YYYY-MM-DD"
    is_stale: bool = False
    days_since_report: int = 0
    no_rate_reported: bool = False
    source: str = "Agmarknet"


class LatestResponse(BaseModel):
    commodity: str
    district: str
    state: str
    query_date: str
    results: List[MandiLatestResult]


class HistoryEntry(BaseModel):
    date: str
    modal_price: Optional[float]
    no_rate_reported: bool


class HistoryResponse(BaseModel):
    mandi: str
    commodity: str
    days: int
    history: List[HistoryEntry]


class CommoditiesResponse(BaseModel):
    commodities: List[CommodityItem]


class DistrictsResponse(BaseModel):
    commodity: str
    districts: List[DistrictItem]


class StatesResponse(BaseModel):
    states: List[str]


class MandisResponse(BaseModel):
    commodity: str
    district: str
    state: Optional[str]
    mandis: List[str]


class HealthResponse(BaseModel):
    status: str
    data_source: str
    csv_rows: int


class DataStatusResponse(BaseModel):
    status: str
    data_source: str
    api_key_configured: bool
    api_key_status: str
    api_message: str
    masked_key: Optional[str] = None
    total_records: int
    unique_states: int
    unique_districts: int
    unique_commodities: int
    unique_mandis: int
    last_refresh_time: Optional[str] = None
    cache_entries: int


class RefreshResponse(BaseModel):
    status: str
    message: str
    records_updated: int
    data_source: str
    timestamp: str
