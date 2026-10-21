"""
sync_agmarknet.py — safe, atomic sync command to fetch official records from
data.gov.in and update the local MandiSaarthi cleaned dataset.

Usage:
    python scripts/sync_agmarknet.py --commodity Wheat
    python scripts/sync_agmarknet.py --all-crops
    python scripts/sync_agmarknet.py --state "Uttar Pradesh"

Guarantees:
  • Reads DATA_GOV_IN_API_KEY from environment or --api-key argument.
  • Never prints the raw API key to stdout or stderr.
  • Writes updates atomically via tempfile + os.replace.
  • Preserves existing records if network fails.
  • Validates price units (INR/Quintal) and reporting dates.
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

# Adjust path to import backend app packages
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config
from app.services import agmarknet, csv_store
from app.utils.normalizer import COMMODITY_MAP


async def run_sync(
    commodity: str | None = None,
    state: str | None = None,
    district: str | None = None,
    api_key: str | None = None,
    output_path: Path | None = None,
) -> int:
    effective_key = api_key or config.DATA_GOV_IN_API_KEY
    if not effective_key:
        print("[ERROR] DATA_GOV_IN_API_KEY is not configured.", file=sys.stderr)
        print("Please configure DATA_GOV_IN_API_KEY in backend/.env or pass --api-key.", file=sys.stderr)
        return 1

    masked = config.mask_secret(effective_key)
    print(f"[*] Initializing Agmarknet data sync using key: {masked}")
    print(f"[*] Filters -> commodity={commodity!r}, state={state!r}, district={district!r}")

    try:
        records = await agmarknet.fetch_agmarknet_records(
            commodity=commodity,
            state=state,
            district=district,
            api_key=effective_key,
            limit_per_page=500,
            max_records=5000,
        )
    except Exception as exc:
        print(f"[ERROR] Sync failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        print("[*] Existing local dataset preserved without corruption.")
        return 1

    if not records:
        print("[!] No records returned from official API for the requested scope.")
        return 0

    print(f"[*] Retrieved {len(records)} verified records from Agmarknet API.")

    # Atomic ingestion into target CSV
    csv_store.load()
    updated_count = csv_store.atomic_ingest_records(records, target_path=output_path)
    print(f"[SUCCESS] Atomically merged and updated {updated_count} records.")
    print(f"[*] Total dataset rows now: {csv_store.row_count()}")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync official Agmarknet records into MandiSaarthi.")
    parser.add_argument("--api-key", default=None, help="data.gov.in API key (optional if set in .env)")
    parser.add_argument("--commodity", default=None, help="Crop name (e.g. Wheat, Onion)")
    parser.add_argument("--state", default=None, help="State filter (e.g. 'Uttar Pradesh')")
    parser.add_argument("--district", default=None, help="District filter")
    parser.add_argument("--output", default=None, help="Custom output CSV path")
    args = parser.parse_args()

    out_p = Path(args.output) if args.output else None
    exit_code = asyncio.run(
        run_sync(
            commodity=args.commodity,
            state=args.state,
            district=args.district,
            api_key=args.api_key,
            output_path=out_p,
        )
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
