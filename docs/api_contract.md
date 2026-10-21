# MandiSaarthi Backend API Contract

> Canonical request/response shapes. Both the backend team (Python) and frontend team (React) MUST follow these exactly.

**Base URL (development):** `http://localhost:8000/api/v1`

---

## Authentication
None required. The API key for Agmarknet lives only in the backend `.env` file and is never exposed to the client.

---

## Common Response Envelope

All error responses:
```json
{ "detail": "Human-readable error message" }
```

---

## Endpoints

### `GET /health`
```json
{ "status": "ok", "data_source": "csv", "csv_rows": 70 }
```
`data_source` is either `"live_api"` or `"csv"`.

---

### `GET /api/v1/meta/commodities`
```json
{
  "commodities": [
    { "name": "Wheat",  "name_hi": "गेहूँ" },
    { "name": "Onion",  "name_hi": "प्याज" },
    { "name": "Tomato", "name_hi": "टमाटर" },
    { "name": "Potato", "name_hi": "आलू" }
  ]
}
```

---

### `GET /api/v1/meta/districts?commodity=Wheat`
```json
{
  "commodity": "Wheat",
  "districts": [
    { "district": "Agra",      "state": "Uttar Pradesh" },
    { "district": "Lucknow",   "state": "Uttar Pradesh" },
    { "district": "Amritsar",  "state": "Punjab" },
    { "district": "Ludhiana",  "state": "Punjab" }
  ]
}
```

---

### `GET /api/v1/prices/latest?commodity=Wheat&district=Agra&state=Uttar Pradesh`
```json
{
  "commodity": "Wheat",
  "district": "Agra",
  "state": "Uttar Pradesh",
  "query_date": "2026-10-21",
  "results": [
    {
      "mandi": "Agra Grain Market",
      "modal_price": 2000.00,
      "min_price": 1820.00,
      "max_price": 2150.00,
      "price_unit": "INR/Quintal",
      "reported_date": "2026-10-21",
      "is_stale": false,
      "days_since_report": 0,
      "no_rate_reported": false,
      "source": "Agmarknet"
    }
  ]
}
```

**Rules:**
- `is_stale = true` when `reported_date != query_date`
- `modal_price = null` when `no_rate_reported = true`
- Results sorted by `modal_price` descending (highest price first)

---

### `GET /api/v1/prices/history?commodity=Wheat&mandi=Agra Grain Market&days=7`
```json
{
  "mandi": "Agra Grain Market",
  "commodity": "Wheat",
  "days": 7,
  "history": [
    { "date": "2026-10-15", "modal_price": 1890.00, "no_rate_reported": false },
    { "date": "2026-10-16", "modal_price": 1910.00, "no_rate_reported": false },
    { "date": "2026-10-17", "modal_price": 1920.00, "no_rate_reported": false },
    { "date": "2026-10-18", "modal_price": null,     "no_rate_reported": true  },
    { "date": "2026-10-19", "modal_price": 1940.00, "no_rate_reported": false },
    { "date": "2026-10-20", "modal_price": 1950.00, "no_rate_reported": false },
    { "date": "2026-10-21", "modal_price": 2000.00, "no_rate_reported": false }
  ]
}
```

**Rules:**
- Always returns exactly `days` entries (one per calendar day)
- Missing dates: `modal_price = null`, `no_rate_reported = true`
- Prices are **NEVER** interpolated

---

### `GET /api/v1/prices/compare?commodity=Wheat&district=Agra&state=Uttar Pradesh`
Same response shape as `/prices/latest`. Kept as a separate endpoint for future filtering/sorting parameters.

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `404` | Commodity or district not found in dataset |
| `422` | Missing required query parameter |
| `500` | Internal server error (fallback to CSV still attempted) |
