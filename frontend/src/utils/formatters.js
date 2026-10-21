/**
 * Format a price number as Indian currency string.
 * e.g. 2000.00 → "₹2,000"
 */
export function formatPrice(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return '₹' + Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
}

/**
 * Format an ISO date string for display.
 * e.g. "2026-10-21" → "21 Oct 2026"
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  // Handle both "2026-10-21" and full ISO strings
  const date = new Date(isoString.includes('T') ? isoString : isoString + 'T00:00:00');
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string as a short DD/MM label for chart axes.
 * e.g. "2026-10-21" → "21/10"
 */
export function formatShortDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString.includes('T') ? isoString : isoString + 'T00:00:00');
  if (isNaN(date.getTime())) return isoString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Interpolate i18n string with variables.
 * e.g. interpolate("Data from {date}", {date: "21 Oct"}) → "Data from 21 Oct"
 */
export function interpolate(template, vars) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars && key in vars ? vars[key] : `{${key}}`
  );
}
