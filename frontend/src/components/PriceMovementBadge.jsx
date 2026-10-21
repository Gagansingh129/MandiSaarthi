import React from 'react';

/**
 * Shows a price trend badge based on the last two non-null price values.
 *
 * Props:
 *   history – array of { date, modal_price, no_rate_reported }
 *   t       – i18n translation function
 */
export default function PriceMovementBadge({ history, t }) {
  // Collect the last two non-null modal_price values (most recent last)
  const validPrices = (history || [])
    .filter((entry) => !entry.no_rate_reported && entry.modal_price !== null && entry.modal_price !== undefined)
    .map((entry) => entry.modal_price);

  if (validPrices.length < 2) {
    return (
      <span className="badge badge-stable">
        → {t ? t('trend_stable') : 'Stable'}
      </span>
    );
  }

  const latest = validPrices[validPrices.length - 1];
  const previous = validPrices[validPrices.length - 2];

  if (latest > previous) {
    return (
      <span className="badge badge-rising">
        ↑ {t ? t('trend_up') : 'Rising'}
      </span>
    );
  }

  if (latest < previous) {
    return (
      <span className="badge badge-falling">
        ↓ {t ? t('trend_down') : 'Falling'}
      </span>
    );
  }

  return (
    <span className="badge badge-stable">
      → {t ? t('trend_stable') : 'Stable'}
    </span>
  );
}
