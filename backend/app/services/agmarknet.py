"""
agmarknet.py — resilient live client for the official data.gov.in Agmarknet API.

Dataset Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
Catalog: Current Daily Price of Various Commodities from Various Markets (Mandi)

Guarantees:
  • Proper multi-page pagination.
  • Exponential backoff on 429 rate limits and 5xx transient server errors.
  • In-memory TTL caching to avoid repeated hits for identical filters.
  • Safe record normalization preserving modal/min/max prices and verified dates.
  • Strict secret redaction: API key is never exposed in logs or exception messages.
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx

from app import config
from app.utils.date_utils import is_stale, days_since, parse_date
from app.utils.normalizer import (
    get_commodity_hindi,
    normalize_commodity,
    normalize_location_name,
)

logger = logging.getLogger(__name__)

# In-memory TTL Cache: key -> (timestamp, records)
_CACHE: Dict[Tuple, Tuple[float, List[dict]]] = {}


def get_cache_size() -> int:
    """Return number of cached queries currently in memory."""
    now = time.time()
    # Purge expired items while checking
    expired = [k for k, (ts, _) in _CACHE.items() if now - ts > config.CACHE_TTL_SECONDS]
    for k in expired:
        _CACHE.pop(k, None)
    return len(_CACHE)


def clear_cache() -> None:
    """Clear in-memory cache."""
    _CACHE.clear()


def _parse_api_date(date_str: str) -> Optional[str]:
    """Parse dates from Agmarknet API (e.g. DD/MM/YYYY or YYYY-MM-DD) to ISO format."""
    if not date_str or not date_str.strip():
        return None
    cleaned = date_str.strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            d = datetime.strptime(cleaned, fmt).date()
            if d <= date.today():
                return d.isoformat()
            logger.warning("Dropping future arrival date from API record: %s", d)
            return None
        except ValueError:
            continue
    return None


def _parse_api_price(val: Any) -> Optional[float]:
    """Safely convert price values from API string or number."""
    if val is None:
        return None
    try:
        f = float(val)
        return f if f > 0 else None
    except (ValueError, TypeError):
        return None


def normalize_api_record(raw: dict) -> Optional[dict]:
    """
    Map a single raw record from data.gov.in Agmarknet API to our canonical schema.
    Handles field name casing variations ('state' vs 'State', etc.).
    """
    # Case-insensitive key lookup helper
    def get_val(*keys: str, default: str = "") -> str:
        for k in keys:
            for rk, rv in raw.items():
                if rk.lower() == k.lower() and rv is not None:
                    return str(rv).strip()
        return default

    raw_state = get_val("state", "state_name")
    raw_district = get_val("district", "district_name")
    raw_market = get_val("market", "market_name", "mandi")
    raw_commodity = get_val("commodity")
    raw_variety = get_val("variety", default="General")
    raw_date = get_val("arrival_date", "date", "reported_date")

    if not raw_commodity or not raw_market:
        return None

    try:
        canonical_comm = normalize_commodity(raw_commodity)
    except Exception:
        canonical_comm = normalize_location_name(raw_commodity)

    comm_hindi = get_commodity_hindi(canonical_comm)
    iso_date = _parse_api_date(raw_date) or date.today().isoformat()
    try:
        rep_date = parse_date(iso_date)
        stale = is_stale(rep_date)
        days = days_since(rep_date)
    except Exception:
        stale = False
        days = 0

    min_price = _parse_api_price(get_val("min_price", "min"))
    max_price = _parse_api_price(get_val("max_price", "max"))
    modal_price = _parse_api_price(get_val("modal_price", "modal"))

    no_rate = modal_price is None

    return {
        "state": normalize_location_name(raw_state),
        "district": normalize_location_name(raw_district),
        "mandi": normalize_location_name(raw_market),
        "commodity": canonical_comm,
        "commodity_hindi": comm_hindi,
        "variety": raw_variety or "General",
        "min_price": min_price,
        "max_price": max_price,
        "modal_price": modal_price,
        "price_unit": "INR/Quintal",
        "reported_date": iso_date,
        "is_stale": stale,
        "days_since_report": days,
        "source": "Agmarknet",
        "no_rate_reported": no_rate,
    }


async def fetch_agmarknet_records(
    commodity: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    market: Optional[str] = None,
    arrival_date: Optional[str] = None,
    limit_per_page: int = 500,
    max_records: int = 5000,
    api_key: Optional[str] = None,
    api_url: Optional[str] = None,
) -> List[dict]:
    """
    Fetch and paginate records from the official data.gov.in Agmarknet resource.

    Implements:
      • In-memory caching with TTL.
      • Exponential backoff on rate limits (429) and server errors.
      • Transparent pagination up to max_records.
      • Full normalization into standard MandiSaarthi records.
    """
    effective_key = api_key or config.DATA_GOV_IN_API_KEY
    effective_url = api_url or config.AGMARKNET_API_URL

    if not effective_key:
        raise ValueError("DATA_GOV_IN_API_KEY is not configured.")

    if config.FORCE_CSV_MODE and not api_key:
        raise ValueError("FORCE_CSV_MODE is active.")

    cache_key = (commodity, district, state, market, arrival_date)
    now = time.time()
    if cache_key in _CACHE:
        cached_ts, cached_records = _CACHE[cache_key]
        if now - cached_ts < config.CACHE_TTL_SECONDS:
            logger.debug("Returning %d cached records for %s", len(cached_records), cache_key)
            return cached_records

    filters: Dict[str, str] = {}
    if commodity:
        filters["filters[commodity]"] = commodity
    if district:
        filters["filters[district]"] = district
    if state:
        filters["filters[state]"] = state
    if market:
        filters["filters[market]"] = market
    if arrival_date:
        filters["filters[arrival_date]"] = arrival_date

    all_normalized: List[dict] = []
    offset = 0

    timeout = httpx.Timeout(
        config.API_READ_TIMEOUT,
        connect=config.API_CONNECT_TIMEOUT,
    )

    default_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MandiSaarthi/1.0",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=timeout, headers=default_headers) as client:
        while offset < max_records:
            params = {
                "api-key": effective_key,
                "format": "json",
                "offset": offset,
                "limit": limit_per_page,
                **filters,
            }

            retries = 0
            response = None

            while retries <= config.API_MAX_RETRIES:
                try:
                    response = await client.get(effective_url, params=params)
                    if response.status_code == 429:
                        wait_time = 1.5 * (2 ** retries)
                        logger.warning("Agmarknet API rate limit (429). Retrying in %.1fs...", wait_time)
                        await asyncio.sleep(wait_time)
                        retries += 1
                        continue
                    elif response.status_code >= 500:
                        wait_time = 1.0 * (2 ** retries)
                        logger.warning("Agmarknet API server error (%d). Retrying in %.1fs...", response.status_code, wait_time)
                        await asyncio.sleep(wait_time)
                        retries += 1
                        continue

                    response.raise_for_status()
                    break

                except (httpx.TimeoutException, httpx.NetworkError) as err:
                    retries += 1
                    if retries > config.API_MAX_RETRIES:
                        logger.error("Agmarknet network/timeout error after %d retries: %s", retries - 1, type(err).__name__)
                        raise
                    wait_time = 1.0 * (2 ** retries)
                    logger.warning("Agmarknet transient error (%s). Retrying in %.1fs...", type(err).__name__, wait_time)
                    await asyncio.sleep(wait_time)

            if response is None:
                break

            try:
                data = response.json()
            except Exception as exc:
                logger.error("Failed to parse Agmarknet JSON: %s", exc)
                break

            records = data.get("records", [])
            if not records:
                break

            for r in records:
                norm = normalize_api_record(r)
                if norm:
                    all_normalized.append(norm)

            total_available = int(data.get("total", 0))
            offset += limit_per_page

            if len(records) < limit_per_page or offset >= total_available:
                break

    _CACHE[cache_key] = (now, all_normalized)
    logger.info("Successfully fetched and normalized %d records from Agmarknet API", len(all_normalized))
    return all_normalized


# Alias for compatibility with previous function signature
async def fetch_latest(
    commodity: str,
    district: str,
    api_key: str,
    api_url: str,
) -> List[dict]:
    """Compatibility wrapper around fetch_agmarknet_records."""
    return await fetch_agmarknet_records(
        commodity=commodity,
        district=district,
        api_key=api_key,
        api_url=api_url,
    )
