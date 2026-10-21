const BASE = '/api/v1';

/**
 * Generic fetch helper. Throws an Error with HTTP status if response is not ok.
 */
async function apiFetch(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/v1/meta/commodities
 * Returns { commodities: [{name, name_hi}] }
 */
export async function fetchCommodities() {
  return apiFetch(`${BASE}/meta/commodities`);
}

/**
 * GET /api/v1/meta/districts?commodity=...
 * Returns { districts: [{district, state}] }
 */
export async function fetchDistricts(commodity) {
  const params = new URLSearchParams({ commodity });
  const response = await fetch(`${BASE}/meta/districts?${params}`);
  if (response.status === 404) {
    return { commodity, districts: [] };
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/v1/prices/latest?commodity=...&district=...&state=...
 * Returns { results: [{mandi, modal_price, min_price, max_price, price_unit,
 *   reported_date, is_stale, days_since_report, no_rate_reported, source}] }
 */
export async function fetchLatest(commodity, district, state) {
  const params = new URLSearchParams();
  if (commodity) params.append('commodity', commodity);
  if (district) params.append('district', district);
  if (state) params.append('state', state);

  const response = await fetch(`${BASE}/prices/latest?${params}`);
  if (response.status === 404) {
    // 404 signifies no reporting mandis found for this combination
    return {
      commodity,
      district,
      state: state || '',
      query_date: new Date().toISOString().split('T')[0],
      results: [],
    };
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/v1/prices/history?commodity=...&mandi=...&days=7
 * Returns { history: [{date, modal_price, no_rate_reported}] }
 */
export async function fetchHistory(commodity, mandi, days = 7) {
  const params = new URLSearchParams({ commodity, mandi, days: String(days) });
  const response = await fetch(`${BASE}/prices/history?${params}`);
  if (response.status === 404) {
    return { mandi, commodity, days, history: [] };
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/v1/prices/compare?commodity=...&district=...&state=...
 * Same shape as fetchLatest
 */
export async function fetchCompare(commodity, district, state) {
  return fetchLatest(commodity, district, state);
}

/**
 * GET /api/v1/meta/states
 * Returns { states: [str] }
 */
export async function fetchStates() {
  return apiFetch(`${BASE}/meta/states`);
}

/**
 * GET /api/v1/meta/mandis?district=...&state=...&commodity=...
 * Returns { mandis: [str] }
 */
export async function fetchMandis(district = '', state = '', commodity = '') {
  const params = new URLSearchParams();
  if (district) params.append('district', district);
  if (state) params.append('state', state);
  if (commodity) params.append('commodity', commodity);
  return apiFetch(`${BASE}/meta/mandis?${params}`);
}

/**
 * GET /api/v1/data/status
 * Returns diagnostics and last sync information without exposing keys.
 */
export async function fetchDataStatus() {
  return apiFetch(`${BASE}/data/status`);
}

/**
 * POST /api/v1/data/refresh
 * Triggers on-demand sync from official Agmarknet API (if configured).
 */
export async function triggerRefresh(commodity = '', district = '', state = '') {
  const params = new URLSearchParams();
  if (commodity) params.append('commodity', commodity);
  if (district) params.append('district', district);
  if (state) params.append('state', state);

  const response = await fetch(`${BASE}/data/refresh?${params}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/v1/health  (health check)
 */
export async function fetchHealth() {
  return apiFetch(`${BASE}/health`);
}
