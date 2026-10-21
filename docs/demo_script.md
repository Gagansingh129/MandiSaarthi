# MandiSaarthi — Hackathon Demo Script

## Setup (30 min before demo)

1. `cd backend && .venv\Scripts\activate && uvicorn app.main:app --port 8000`
2. `cd frontend && npm run dev`
3. Open `http://localhost:5173` in Chrome (mobile emulation mode: 390 × 844)
4. Run manual checklist (see below) — fix anything that fails

## Demo Flow (~5 minutes)

### Opening (30 sec)
*"MandiSaarthi answers one question every farmer has: which mandi should I sell my crop at today?"*

### Step 1 — Select crop (30 sec)
- Select **Wheat / गेहूँ** from the commodity dropdown
- Select **Agra, Uttar Pradesh** from the district selector
- **Talking point:** Selectors are bilingual — tap the EN/HI toggle to switch language

### Step 2 — Latest price card (1 min)
- Point to the modal price, the reporting date, and the price unit label (INR/Quintal)
- If today's date ≠ reporting date, show the **staleness warning banner**
- **Talking point:** We never show yesterday's price as today's. The banner tells the farmer exactly how old the data is.

### Step 3 — No rate reported (30 sec)
- Switch to **Amritsar, Punjab**
- Find a mandi that shows **"No rate reported"**
- **Talking point:** We don't fabricate prices. If a mandi didn't trade, we say so clearly.

### Step 4 — Comparison view (1 min)
- Come back to **Wheat, Agra**
- The comparison grid shows all mandis in one view
- **Talking point:** A farmer can instantly see which mandi is offering a higher price today without calling anyone.

### Step 5 — Price history chart (1 min)
- Tap any mandi card to expand the 7-day chart
- Point to a gap in the chart line (missing date)
- **Talking point:** Chart gaps are real — we never connect missing dates. Data integrity is non-negotiable.

### Closing (30 sec)
*"The demo runs entirely offline from a bundled clean snapshot of Agmarknet data. When the live API is available, we seamlessly switch. The architecture ensures we never show fabricated prices."*

---

## Pre-Demo Checklist

- [ ] Both servers running (`uvicorn` + `npm run dev`)
- [ ] App loads at 390 px width without horizontal scroll
- [ ] Commodity + district selectors populated
- [ ] At least one mandi card shows a staleness warning
- [ ] At least one mandi shows "No rate reported"
- [ ] Hindi/English toggle works
- [ ] Chart line has a visible gap for a missing date
- [ ] `GET /health` returns `{ "status": "ok" }`
- [ ] Wi-Fi disabled — app still works (CSV fallback)

## Fallback Screenshots

Keep screenshots of all 5 demo steps in `docs/screenshots/` in case of a projector or laptop emergency.
