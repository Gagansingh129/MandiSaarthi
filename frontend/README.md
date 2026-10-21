# MandiSaarthi — Frontend

React + Vite frontend for the MandiSaarthi agricultural mandi price intelligence app.

## Prerequisites

- **Node.js** 18 or later ([nodejs.org](https://nodejs.org))
- **Backend** running on `http://localhost:8000` (see `../backend/README.md`)

## Setup (Windows)

### 1. Install dependencies

```powershell
cd frontend
npm install
```

### 2. Configure environment

```powershell
copy .env.example .env
```

Open `.env` and adjust if needed (defaults work for local development).

### 3. Start the dev server

```powershell
npm run dev
```

The app will be available at **http://localhost:5173**.  
API calls are proxied automatically to `http://localhost:8000` — no CORS issues.

## Build for production

```powershell
npm run build
```

Output is in `dist/`. Serve with any static file server.

## Project structure

```
src/
  api/          – API fetch functions (mandiApi.js)
  components/   – React UI components
  hooks/        – Custom React hooks (useMandiData.js)
  i18n/         – Translation strings (en.json, hi.json)
  styles/       – Global CSS (index.css)
  utils/        – Helper utilities (formatters.js)
  App.jsx       – Root component
  main.jsx      – Entry point
```

## Key features

- 🌾 **Commodity + District selectors** — bilingual labels
- 💰 **Latest mandi prices** — modal, min, max per mandi
- ⚠️ **Staleness warning** — highlighted when data is older than today
- 📈 **7-day price trend chart** — gaps preserved for missing dates
- 🔤 **Hindi / English toggle** — switches all UI labels
- 📱 **Mobile-first** — works at 360px width

## Notes

- The backend **must** be running on port 8000 before starting the frontend.
- If the backend is unavailable, the app shows a clear error state rather than a blank screen.
- Prices tagged `source = "Synthetic-Test"` display a visible **[Test Data]** badge.
