# MandiSaarthi — Data Dictionary

## `mandi_prices.csv` Column Reference

| Column | Type | Required | Example | Notes |
|---|---|---|---|---|
| `state` | string | Yes | `Uttar Pradesh` | Title case, normalized |
| `district` | string | Yes | `Agra` | Title case; always paired with `state` for uniqueness |
| `mandi` | string | Yes | `Agra Grain Market` | Original market name, preserved |
| `commodity` | string | Yes | `Wheat` | Canonical English name from normalizer map |
| `commodity_hindi` | string | Yes | `गेहूँ` | Devanagari display name |
| `variety` | string | Yes | `Lokwan` | Grade/variety; `"General"` if not specified |
| `min_price` | float or empty | — | `1820.00` | Empty when `no_rate_reported=true` |
| `max_price` | float or empty | — | `2150.00` | Empty when `no_rate_reported=true` |
| `modal_price` | float or empty | — | `2000.00` | Primary display price; empty when `no_rate_reported=true` |
| `price_unit` | string or empty | — | `INR/Quintal` | Always `INR/Quintal`; empty when `no_rate_reported=true` |
| `reported_date` | date (ISO 8601) | Yes | `2026-10-21` | Actual reporting date; never fabricated |
| `source` | string | Yes | `Agmarknet` | `Agmarknet` or `Synthetic-Test` only |
| `no_rate_reported` | boolean | Yes | `false` | `true` = mandi had no trading on this date |

## Invariants (enforced by `clean_data.py` and `test_data_integrity.py`)

1. `reported_date` is never in the future.
2. `modal_price` is `null`/empty if and only if `no_rate_reported = true`.
3. All prices are positive when present.
4. `price_unit` is always `INR/Quintal` when present.
5. No exact duplicate rows.
6. `source` is exactly `"Agmarknet"` or `"Synthetic-Test"`.
7. Test fixture rows always have `source = "Synthetic-Test"`.
