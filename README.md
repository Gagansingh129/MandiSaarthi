# MandiSaarthi 🌾

**Sahi Bhav, Sahi Mandi, Behtar Faisla.**

A lightweight, farmer-friendly agricultural mandi price intelligence app for India.
Helps farmers decide *where* to sell their crop using official Agmarknet price data.

---

## Quick Start (Windows)

### Prerequisites
| Tool | Version |
|---|---|
| Node.js | 20 LTS |
| Python | 3.11 or 3.12 |
| Git | Latest |

### Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env        # then fill in values
uvicorn app.main:app --reload --port 8000
```

### Frontend (separate terminal)
```powershell
cd frontend
npm install
copy .env.example .env        # set VITE_API_BASE_URL
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
MandiSaarthi/
├── backend/      Python + FastAPI service
├── frontend/     React + Vite SPA
└── docs/         API contract, data dictionary, demo script
```

See `backend/README.md` and `frontend/README.md` for detailed setup.

---

## Data

- Prices sourced from [Agmarknet / data.gov.in](https://data.gov.in/catalog/current-daily-price-different-commodities-various-markets-india)
- Bundled cleaned snapshot: `backend/data/cleaned/mandi_prices.csv`
- Synthetic test fixtures: `backend/data/fixtures/test_prices.csv` *(clearly labelled)*
- **Prices are never fabricated.** Missing dates show "No rate reported."

---

## License

MIT
