"""
clean_data.py — data cleaning pipeline for MandiSaarthi.

Usage:
    python scripts/clean_data.py --input data/raw/agmarknet.csv \
                                  --output data/cleaned/mandi_prices.csv
"""
from __future__ import annotations

import argparse
import logging
import sys
from datetime import date, datetime
from pathlib import Path

import pandas as pd

# ---------------------------------------------------------------------------
# Adjust import path so we can reuse app-level helpers
# ---------------------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.utils.normalizer import COMMODITY_HINDI, normalize_commodity

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Column name mapping: raw Agmarknet → our schema
# ---------------------------------------------------------------------------
RAW_COLUMN_MAP: dict[str, str] = {
    "state name": "state",
    "district name": "district",
    "market name": "mandi",
    "commodity": "commodity",
    "variety": "variety",
    "arrival date": "reported_date",
    "min price": "min_price",
    "max price": "max_price",
    "modal price": "modal_price",
    # already-clean column names
    "state": "state",
    "mandi": "mandi",
    "min_price": "min_price",
    "max_price": "max_price",
    "modal_price": "modal_price",
    "reported_date": "reported_date",
}

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


def _read_csv(path: Path) -> pd.DataFrame:
    """Read CSV with utf-8 fallback to latin-1."""
    try:
        return pd.read_csv(path, dtype=str, keep_default_na=False)
    except UnicodeDecodeError:
        logger.warning("UTF-8 decode failed; retrying with latin-1.")
        return pd.read_csv(path, dtype=str, keep_default_na=False, encoding="latin-1")


def clean(input_path: Path, output_path: Path) -> None:
    # --- 1. Read -----------------------------------------------------------
    logger.info("Reading: %s", input_path)
    df = _read_csv(input_path)
    rows_in = len(df)
    logger.info("Rows in: %d", rows_in)

    # --- 2. Normalise column names -----------------------------------------
    df.columns = [c.strip().lower() for c in df.columns]
    df.rename(columns={k: v for k, v in RAW_COLUMN_MAP.items() if k in df.columns}, inplace=True)

    # Ensure required columns exist
    for col in ("commodity", "district", "state", "mandi"):
        if col not in df.columns:
            df[col] = ""

    # --- 3. Commodity normalisation ----------------------------------------
    unmapped: list[str] = []
    canonical_list: list[str] = []
    keep_mask: list[bool] = []
    for val in df["commodity"]:
        try:
            canonical_list.append(normalize_commodity(val))
            keep_mask.append(True)
        except ValueError:
            if val not in unmapped:
                unmapped.append(val)
                logger.warning("Skipping unknown commodity: %r", val)
            canonical_list.append("")
            keep_mask.append(False)

    df["commodity"] = canonical_list
    df = df[keep_mask].copy()

    # --- 4. Title-case geographic fields -----------------------------------
    for col in ("district", "state", "mandi"):
        df[col] = df[col].str.strip().str.title()

    # --- 5. commodity_hindi ------------------------------------------------
    df["commodity_hindi"] = df["commodity"].map(COMMODITY_HINDI).fillna("")

    # --- 6. price_unit -----------------------------------------------------
    df["price_unit"] = "INR/Quintal"

    # --- 7. Parse reported_date; drop future-dated rows --------------------
    today = date.today()
    parsed_dates: list[str] = []
    future_mask: list[bool] = []
    for val in df["reported_date"]:
        try:
            d = datetime.strptime(val.strip(), "%d/%m/%Y").date()
        except ValueError:
            try:
                d = datetime.fromisoformat(val.strip()).date()
            except ValueError:
                d = None  # type: ignore[assignment]

        if d is None:
            parsed_dates.append("")
            future_mask.append(True)  # drop
        elif d > today:
            logger.warning("Dropping future-dated row: %s", d)
            parsed_dates.append(d.isoformat())
            future_mask.append(True)
        else:
            parsed_dates.append(d.isoformat())
            future_mask.append(False)

    df["reported_date"] = parsed_dates
    df = df[[not m for m in future_mask]].copy()  # type: ignore[call-overload]

    # --- 8. Convert prices to float ----------------------------------------
    for col in ("min_price", "max_price", "modal_price"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        else:
            df[col] = float("nan")

    # Rows where ALL THREE prices are NaN → no_rate_reported = True
    all_nan = df["min_price"].isna() & df["max_price"].isna() & df["modal_price"].isna()
    df["no_rate_reported"] = all_nan

    # --- 9. Validate: prices must be > 0 when present ----------------------
    for col in ("min_price", "max_price", "modal_price"):
        bad = (~df[col].isna()) & (df[col] <= 0)
        if bad.any():
            logger.warning("Dropping %d rows with non-positive %s", bad.sum(), col)
            df = df[~bad].copy()

    # --- 10. Deduplication -------------------------------------------------
    exact_before = len(df)
    df.drop_duplicates(inplace=True)
    exact_dropped = exact_before - len(df)
    if exact_dropped:
        logger.info("Dropped %d exact duplicates.", exact_dropped)

    # Conflict: same mandi+commodity+date but different prices → keep last
    conflict_cols = ["mandi", "commodity", "reported_date"]
    conflicts_before = len(df)
    df = df.groupby(conflict_cols, as_index=False, sort=False).last()
    conflicts_found = conflicts_before - len(df)
    if conflicts_found:
        logger.warning("Resolved %d conflicting mandi+commodity+date rows (kept last).", conflicts_found)

    # --- 11. Source --------------------------------------------------------
    df["source"] = "Agmarknet"

    # --- 12. Variety fallback ---------------------------------------------
    if "variety" not in df.columns:
        df["variety"] = ""
    df["variety"] = df["variety"].fillna("")

    # --- 13. Write output --------------------------------------------------
    # Keep only known output columns; add missing ones as empty
    for col in OUTPUT_COLUMNS:
        if col not in df.columns:
            df[col] = ""

    df = df[OUTPUT_COLUMNS]

    # Serialise prices back to 2-decimal strings for readability
    for col in ("min_price", "max_price", "modal_price"):
        df[col] = df[col].apply(lambda x: f"{x:.2f}" if pd.notna(x) else "")

    df["no_rate_reported"] = df["no_rate_reported"].map({True: "true", False: "false"})

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

    rows_out = len(df)
    rows_dropped = rows_in - rows_out
    logger.info("=== Summary ===")
    logger.info("  Rows in       : %d", rows_in)
    logger.info("  Rows out      : %d", rows_out)
    logger.info("  Rows dropped  : %d", rows_dropped)
    logger.info("  Conflicts     : %d", conflicts_found)
    logger.info("  Output        : %s", output_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean raw Agmarknet CSV data.")
    parser.add_argument("--input", required=True, help="Path to raw CSV file.")
    parser.add_argument("--output", required=True, help="Path for cleaned output CSV.")
    args = parser.parse_args()

    clean(Path(args.input), Path(args.output))


if __name__ == "__main__":
    main()
