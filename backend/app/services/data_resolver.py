"""
data_resolver.py — orchestrates live Agmarknet API fetching, caching, and
seamless offline fallback to csv_store.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional

from app import config
from app.services import agmarknet, csv_store

logger = logging.getLogger(__name__)

_last_source: str = "csv"
_last_refresh_time: Optional[str] = None


def get_source() -> str:
    """Returns 'live_api' or 'csv' depending on the data source last used."""
    return _last_source


def get_last_refresh_time() -> Optional[str]:
    """Return the ISO 8601 timestamp of the last successful live API fetch."""
    return _last_refresh_time


async def get_latest(commodity: str, district: str, state: Optional[str]) -> List[dict]:
    """
    Attempt to fetch latest price records from the official live API first.
    If live API is disabled, unconfigured, times out, or fails:
    smoothly falls back to the bundled cleaned CSV snapshot.
    """
    global _last_source, _last_refresh_time

    if not config.FORCE_CSV_MODE and config.DATA_GOV_IN_API_KEY:
        try:
            live_records = await agmarknet.fetch_agmarknet_records(
                commodity=commodity,
                district=district,
                state=state,
                limit_per_page=500,
            )

            if live_records:
                _last_source = "live_api"
                _last_refresh_time = datetime.now().isoformat()
                # Atomically update local CSV cache so offline mode stays up to date
                try:
                    csv_store.atomic_ingest_records(live_records)
                except Exception as ingest_err:
                    logger.warning("Could not persist live records to CSV: %s", ingest_err)

                # Return latest per mandi from live records
                # Filter matching commodity and district
                filtered = [
                    r for r in live_records
                    if r["commodity"].lower() == commodity.lower()
                    and r["district"].lower() == district.lower()
                ]
                if state:
                    filtered = [r for r in filtered if r["state"].lower() == state.lower()]

                if filtered:
                    # Pick highest reported_date per mandi
                    by_mandi: dict[str, dict] = {}
                    for r in filtered:
                        m = r["mandi"]
                        if m not in by_mandi or r["reported_date"] > by_mandi[m]["reported_date"]:
                            by_mandi[m] = r
                    results = list(by_mandi.values())
                    results.sort(key=lambda x: (x["modal_price"] is None, -(x["modal_price"] or 0)))
                    return results

        except Exception as exc:
            logger.warning("Live API call failed (%s: %s); falling back to bundled CSV snapshot.", type(exc).__name__, exc)

    _last_source = "csv"
    return csv_store.get_latest(commodity=commodity, district=district, state=state)


async def get_history(commodity: str, mandi: str, days: int) -> List[dict]:
    """
    Historical daily prices are read from the verified local series.
    (Government daily API resource provides current daily snapshots).
    """
    return csv_store.get_history(commodity=commodity, mandi=mandi, days=days)


async def refresh_market_data(
    commodity: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
) -> dict:
    """
    On-demand data refresh action. Queries API for new records and updates store.
    """
    global _last_source, _last_refresh_time

    if not config.DATA_GOV_IN_API_KEY:
        return {
            "status": "warning",
            "message": "DATA_GOV_IN_API_KEY is not configured. Running on verified offline snapshot.",
            "records_updated": 0,
            "data_source": "csv",
            "timestamp": datetime.now().isoformat(),
        }

    try:
        records = await agmarknet.fetch_agmarknet_records(
            commodity=commodity,
            district=district,
            state=state,
            limit_per_page=500,
        )
        if records:
            count = csv_store.atomic_ingest_records(records)
            _last_source = "live_api"
            _last_refresh_time = datetime.now().isoformat()
            return {
                "status": "success",
                "message": f"Successfully synced {count} records from Agmarknet API.",
                "records_updated": count,
                "data_source": "live_api",
                "timestamp": _last_refresh_time,
            }
        else:
            return {
                "status": "info",
                "message": "API returned 0 new records for this scope. Preserved existing snapshot.",
                "records_updated": 0,
                "data_source": _last_source,
                "timestamp": datetime.now().isoformat(),
            }
    except Exception as exc:
        logger.error("Refresh request failed: %s", exc)
        return {
            "status": "error",
            "message": f"Sync failed: {type(exc).__name__}. Retained current dataset without corruption.",
            "records_updated": 0,
            "data_source": "csv",
            "timestamp": datetime.now().isoformat(),
        }


def get_diagnostics() -> dict:
    """Return detailed system diagnostics and provenance."""
    api_diag = config.get_api_key_diagnostic()
    meta = csv_store.get_metadata_summary()
    return {
        "status": "ok",
        "data_source": _last_source,
        "api_key_configured": api_diag["configured"],
        "api_key_status": api_diag["status"],
        "api_message": api_diag["message"],
        "masked_key": api_diag.get("masked_key"),
        "total_records": meta["total_records"],
        "unique_states": meta["unique_states"],
        "unique_districts": meta["unique_districts"],
        "unique_commodities": meta["unique_commodities"],
        "unique_mandis": meta["unique_mandis"],
        "last_refresh_time": _last_refresh_time,
        "cache_entries": agmarknet.get_cache_size(),
    }
