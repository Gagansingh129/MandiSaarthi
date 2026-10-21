# MandiSaarthi Backend

FastAPI backend for the MandiSaarthi agricultural mandi price intelligence app.

---

## Prerequisites

- Python 3.11+
- Windows (PowerShell) or compatible shell

---

## Setup (Windows)

### 1. Create and activate a virtual environment

```powershell
cd c:\Users\LOQ\Downloads\MandiSaarthi\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment variables

```powershell
Copy-Item .env.example .env
# Edit .env as needed (API key is optional; FORCE_CSV_MODE=true works for demo)
notepad .env
```

---

## Running the development server

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`.  
Interactive docs: `http://127.0.0.1:8000/docs`

---

## Running tests

```powershell
# From the backend/ directory with venv activated:
pytest tests/ -v
```

---

## Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health + CSV row count |
| GET | `/api/v1/meta/commodities` | List all commodities |
| GET | `/api/v1/meta/districts?commodity=Wheat` | Districts for a commodity |
| GET | `/api/v1/prices/latest?commodity=Wheat&district=Agra` | Latest mandi prices |
| GET | `/api/v1/prices/compare?commodity=Wheat&district=Agra` | Compare mandis |
| GET | `/api/v1/prices/history?commodity=Wheat&mandi=Agra+Grain+Market&days=7` | Price history |

---

## Data integrity notes

- All prices are **INR/Quintal**.
- Prices are **never fabricated**; only CSV data is returned.
- Missing dates in history return `modal_price: null, no_rate_reported: true`.
- `is_stale: true` when `reported_date` is before today.

---

## Data cleaning pipeline

To re-generate the cleaned CSV from raw Agmarknet data:

```powershell
python scripts/clean_data.py --input data/raw/agmarknet.csv --output data/cleaned/mandi_prices.csv
```

To download fresh raw data (requires a data.gov.in API key):

```powershell
python scripts/fetch_agmarknet.py --api-key YOUR_KEY --commodity Wheat
```
