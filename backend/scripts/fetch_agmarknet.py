"""
fetch_agmarknet.py — download raw data from data.gov.in Agmarknet API.

Usage:
    python scripts/fetch_agmarknet.py --api-key YOUR_KEY --commodity Wheat

Saves a timestamped CSV to data/raw/.
Prints a warning if no API key is provided.
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
import warnings
from datetime import datetime
from pathlib import Path

import httpx

BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"


def fetch(api_key: str, commodity: str, limit: int = 500) -> list[dict]:
    """Fetch records from the Agmarknet data.gov.in resource."""
    all_records: list[dict] = []
    offset = 0

    with httpx.Client(timeout=30.0) as client:
        while True:
            params = {
                "api-key": api_key,
                "format": "json",
                "filters[commodity]": commodity,
                "limit": limit,
                "offset": offset,
            }
            resp = client.get(BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            records = data.get("records", [])
            all_records.extend(records)

            total = int(data.get("total", 0))
            offset += limit
            if offset >= total:
                break

    return all_records


def save_csv(records: list[dict], output_dir: Path, commodity: str) -> Path:
    if not records:
        print("No records returned.")
        return Path()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"agmarknet_{commodity.lower()}_{timestamp}.csv"
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / filename

    fieldnames = list(records[0].keys())
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Saved {len(records)} records to {out_path}")
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download raw Agmarknet data from data.gov.in."
    )
    parser.add_argument("--api-key", default="", help="data.gov.in API key.")
    parser.add_argument("--commodity", default="Wheat", help="Commodity name to fetch.")
    parser.add_argument(
        "--output-dir",
        default="data/raw",
        help="Directory to save downloaded CSV (default: data/raw).",
    )
    args = parser.parse_args()

    effective_key = args.api_key or os.getenv("DATA_GOV_IN_API_KEY") or os.getenv("AGMARKNET_API_KEY", "")
    if not effective_key:
        warnings.warn(
            "No API key provided. The API will likely return an error or limited data.",
            UserWarning,
            stacklevel=1,
        )

    try:
        records = fetch(api_key=effective_key, commodity=args.commodity)
    except httpx.HTTPStatusError as exc:
        print(f"HTTP error: {exc.response.status_code} — {exc.response.text}", file=sys.stderr)
        sys.exit(1)
    except httpx.RequestError as exc:
        print(f"Network error: {exc}", file=sys.stderr)
        sys.exit(1)

    save_csv(records, Path(args.output_dir), args.commodity)


if __name__ == "__main__":
    main()
