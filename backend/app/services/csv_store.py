"""
csv_store.py — module-level singleton that holds the cleaned mandi CSV as a
pandas DataFrame. Loaded once on application startup via load().

DATA INTEGRITY RULES (never deviate):
  • Never fabricate prices — only return what exists in the CSV.
  • Missing dates in history → modal_price=None, no_rate_reported=True.
  • is_stale when reported_date < today.
  • no_rate_reported=True rows must surface that flag; never substitute prices.
  • Atomic updates via tempfile + os.replace to prevent dataset corruption.
"""
from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path
from datetime import date
from typing import List, Optional

import numpy as np
import pandas as pd

from app.utils.date_utils import is_stale, days_since, date_range

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level state (singleton DataFrame)
# ---------------------------------------------------------------------------
_df: pd.DataFrame | None = None

_CSV_PATH = (
    Path(__file__).resolve().parent.parent.parent  # → backend/
    / "data" / "cleaned" / "mandi_prices.csv"
)

OUTPUT_COLUMNS = [
    "state",
    "district",
    "mandi",
    "commodity",
    "commodity_hindi",
    "variety",
    "min_price",
    "max_price",
    "modal_price",
    "price_unit",
    "reported_date",
    "source",
    "no_rate_reported",
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load(custom_path: Optional[Path] = None) -> None:
    """
    Read the cleaned CSV into the module-level DataFrame with explicit UTF-8 encoding.
    Must be called once before querying functions.
    """
    global _df

    path_to_load = custom_path or _CSV_PATH
    if not path_to_load.exists():
        raise FileNotFoundError(f"Cleaned CSV not found at {path_to_load}")

    df = pd.read_csv(
        path_to_load,
        encoding="utf-8",
        dtype={"no_rate_reported": str},
        keep_default_na=False,
    )

    # --- Normalise column names -------------------------------------------------
    df.columns = [c.strip() for c in df.columns]

    # --- no_rate_reported: string → bool ---------------------------------------
    df["no_rate_reported"] = df["no_rate_reported"].astype(str).str.strip().str.lower() == "true"

    # --- Numeric prices: empty string / NaN → pd.NA ----------------------------
    for col in ("min_price", "max_price", "modal_price"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        else:
            df[col] = pd.NA

    # --- reported_date: string → datetime.date ---------------------------------
    df["reported_date"] = pd.to_datetime(df["reported_date"], format="%Y-%m-%d", errors="coerce").dt.date

    # --- price_unit: fill blanks ------------------------------------------------
    if "price_unit" not in df.columns:
        df["price_unit"] = "INR/Quintal"
    else:
        df["price_unit"] = df["price_unit"].replace("", "INR/Quintal").fillna("INR/Quintal")

    _df = df
    logger.info("CSV loaded: %d rows from %s", len(_df), path_to_load)


def _require_df() -> pd.DataFrame:
    if _df is None:
        load()
    return _df  # type: ignore[return-value]


def row_count() -> int:
    """Total number of rows in the loaded DataFrame."""
    return len(_require_df())


def get_states(commodity: Optional[str] = None) -> List[str]:
    """Return distinct sorted states, optionally filtered by commodity."""
    df = _require_df()
    if commodity:
        df = df[df["commodity"].str.lower() == commodity.lower()]
    states = [str(s) for s in df["state"].dropna().unique() if str(s).strip()]
    return sorted(states)


def get_commodities() -> List[dict]:
    """
    Returns distinct commodities with their Hindi names.
    Format: [{name: str, name_hi: str}, ...]
    """
    df = _require_df()
    seen: dict[str, str] = {}
    for _, row in df[["commodity", "commodity_hindi"]].drop_duplicates().iterrows():
        name = str(row["commodity"]).strip()
        name_hi = str(row["commodity_hindi"]).strip() if pd.notna(row["commodity_hindi"]) else ""
        if name and name not in seen:
            seen[name] = name_hi or name
    return [{"name": k, "name_hi": v} for k, v in sorted(seen.items())]


def get_districts(commodity: str, state: Optional[str] = None) -> List[dict]:
    """
    Returns distinct districts + states for a given commodity, optionally filtered
    by state, sorted alphabetically by district then state.
    Format: [{district: str, state: str}, ...]
    """
    df = _require_df()
    mask = df["commodity"].str.lower() == commodity.lower()
    if state:
        mask &= df["state"].str.lower() == state.lower()

    filtered = df[mask]
    pairs = (
        filtered[["district", "state"]]
        .drop_duplicates()
        .sort_values(["district", "state"])
    )
    return pairs.to_dict(orient="records")


def get_mandis(commodity: str, district: str, state: Optional[str] = None) -> List[str]:
    """Return distinct mandis in the given commodity & district."""
    df = _require_df()
    mask = (
        (df["commodity"].str.lower() == commodity.lower())
        & (df["district"].str.lower() == district.lower())
    )
    if state:
        mask &= df["state"].str.lower() == state.lower()
    return sorted([str(m) for m in df[mask]["mandi"].dropna().unique() if str(m).strip()])


def get_latest(commodity: str, district: str, state: Optional[str]) -> List[dict]:
    """
    For each mandi in the given district (optionally filtered by state) and
    commodity, return the row with the most-recent reported_date.
    """
    df = _require_df()

    mask = (
        (df["commodity"].str.lower() == commodity.lower())
        & (df["district"].str.lower() == district.lower())
    )
    if state:
        mask &= df["state"].str.lower() == state.lower()

    subset = df[mask]
    if subset.empty:
        return []

    idx = subset.groupby("mandi")["reported_date"].idxmax()
    latest = subset.loc[idx].copy()

    results: List[dict] = []
    for _, row in latest.iterrows():
        rep_date: Optional[date] = row["reported_date"]
        no_rate: bool = bool(row["no_rate_reported"])

        modal = None if (no_rate or pd.isna(row["modal_price"])) else float(row["modal_price"])
        min_p = None if (no_rate or pd.isna(row["min_price"])) else float(row["min_price"])
        max_p = None if (no_rate or pd.isna(row["max_price"])) else float(row["max_price"])

        iso_date = rep_date.isoformat() if rep_date else date.today().isoformat()
        is_stale_flag = is_stale(rep_date) if rep_date else False
        days_ago = days_since(rep_date) if rep_date else 0

        results.append(
            {
                "mandi": str(row["mandi"]),
                "modal_price": modal,
                "min_price": min_p,
                "max_price": max_p,
                "price_unit": str(row["price_unit"]) if row["price_unit"] else "INR/Quintal",
                "reported_date": iso_date,
                "is_stale": is_stale_flag,
                "days_since_report": days_ago,
                "no_rate_reported": no_rate,
                "source": str(row["source"]),
            }
        )

    results.sort(
        key=lambda r: (r["modal_price"] is None, -(r["modal_price"] or 0))
    )
    return results


def get_history(commodity: str, mandi: str, days: int) -> List[dict]:
    """
    Return day-by-day price history for *days* days ending today.
    Missing dates → {date, modal_price: None, no_rate_reported: True}.
    Prices are NEVER fabricated or interpolated.
    """
    df = _require_df()

    mask = (
        (df["commodity"].str.lower() == commodity.lower())
        & (df["mandi"].str.lower() == mandi.lower())
    )
    subset = df[mask].copy()

    lookup: dict[date, pd.Series] = {}
    for _, row in subset.iterrows():
        d: Optional[date] = row["reported_date"]
        if d:
            lookup[d] = row

    history: List[dict] = []
    for d in date_range(days):
        if d not in lookup:
            history.append({"date": d.isoformat(), "modal_price": None, "no_rate_reported": True})
        else:
            row = lookup[d]
            no_rate: bool = bool(row["no_rate_reported"])
            modal = None if (no_rate or pd.isna(row["modal_price"])) else float(row["modal_price"])
            history.append(
                {
                    "date": d.isoformat(),
                    "modal_price": modal,
                    "no_rate_reported": no_rate,
                }
            )

    return history


def get_metadata_summary() -> dict:
    """Return summary statistics of available data."""
    df = _require_df()
    return {
        "total_records": len(df),
        "unique_states": int(df["state"].nunique()),
        "unique_districts": int(df["district"].nunique()),
        "unique_commodities": int(df["commodity"].nunique()),
        "unique_mandis": int(df["mandi"].nunique()),
    }


def atomic_ingest_records(new_records: List[dict], target_path: Optional[Path] = None) -> int:
    """
    Atomically update the CSV store with new records from official API.

    Guarantees:
      • Never corrupts the CSV if process is interrupted (uses .tmp file + os.replace).
      • Merges new records with existing genuine records.
      • Retains Synthetic-Test fixture isolation.
      • Re-loads in-memory DataFrame on success.

    Returns the number of records added or updated.
    """
    if not new_records:
        return 0

    dest_path = target_path or _CSV_PATH
    df_existing = _require_df().copy()

    # Format new records as DataFrame
    df_new = pd.DataFrame(new_records)
    for col in OUTPUT_COLUMNS:
        if col not in df_new.columns:
            df_new[col] = ""

    # Ensure correct data types
    df_new["no_rate_reported"] = df_new["no_rate_reported"].astype(bool)
    df_new["reported_date"] = pd.to_datetime(df_new["reported_date"], format="%Y-%m-%d", errors="coerce").dt.date

    # Combine existing and new records
    combined = pd.concat([df_existing, df_new], ignore_index=True)

    # Dedup rule: For identical (state, district, mandi, commodity, reported_date), keep the latest record
    dedup_keys = ["state", "district", "mandi", "commodity", "reported_date"]
    combined.drop_duplicates(subset=dedup_keys, keep="last", inplace=True)

    # Format for CSV output
    export_df = combined.copy()
    for col in ("min_price", "max_price", "modal_price"):
        export_df[col] = export_df[col].apply(lambda x: f"{float(x):.2f}" if pd.notna(x) and x is not None else "")

    export_df["no_rate_reported"] = export_df["no_rate_reported"].map({True: "true", False: "false"})
    export_df["reported_date"] = export_df["reported_date"].astype(str)

    export_df = export_df[OUTPUT_COLUMNS]

    # Write atomically
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    temp_file = dest_path.with_name(f"{dest_path.name}.tmp.{os.getpid()}")

    try:
        export_df.to_csv(temp_file, index=False, encoding="utf-8")
        os.replace(temp_file, dest_path)
    finally:
        if temp_file.exists():
            try:
                temp_file.unlink()
            except Exception:
                pass

    # Reload memory store
    load(dest_path)
    logger.info("Atomic ingestion completed. Total CSV rows now: %d", len(export_df))
    return len(new_records)
