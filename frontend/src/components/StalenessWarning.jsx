import React from 'react';
import { formatDate, interpolate } from '../utils/formatters';

/**
 * Displays an amber staleness warning banner.
 *
 * Props:
 *   reportedDate  – ISO date string of the last reported date
 *   daysAgo       – number of days since reporting
 *   t             – i18n translation function
 */
export default function StalenessWarning({ reportedDate, daysAgo, t }) {
  const formattedDate = formatDate(reportedDate);
  const warningText = interpolate(t('stale_warning'), { date: formattedDate });
  const daysText = interpolate(t('days_ago'), { n: daysAgo });

  return (
    <div className="staleness-warning" role="alert">
      <span className="staleness-icon">⚠️</span>
      <span>
        {warningText}
        {daysAgo > 0 && (
          <span className="staleness-days"> ({daysText})</span>
        )}
      </span>
    </div>
  );
}
