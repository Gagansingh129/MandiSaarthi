import React, { useState } from 'react';
import { formatPrice, formatDate } from '../utils/formatters';
import { useHistory } from '../hooks/useMandiData';
import StalenessWarning from './StalenessWarning';
import PriceMovementBadge from './PriceMovementBadge';
import PriceHistoryChart from './PriceHistoryChart';

/**
 * Card displaying latest price info for a single mandi.
 *
 * Props:
 *   result    – one item from /prices/latest response
 *   commodity – string (for fetching history)
 *   onExpand  – optional callback when expanded state changes
 *   expanded  – controlled expanded state (optional; falls back to internal state)
 *   t         – i18n translation function
 */
export default function MandiCard({ result, commodity, onExpand, expanded: expandedProp, t }) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const { history } = useHistory(commodity, result.mandi, 7);

  // Support both controlled and uncontrolled expanded state
  const expanded = expandedProp !== undefined ? expandedProp : internalExpanded;

  function toggleExpand() {
    const next = !expanded;
    setInternalExpanded(next);
    if (onExpand) onExpand(next);
  }

  const isTestData = result.source === 'Synthetic-Test';

  return (
    <article className="card mandi-card">
      {/* ── Card header (tappable) ── */}
      <div
        className="mandi-card-header"
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpand()}
      >
        <div className="mandi-card-title-row">
          <h2 className="mandi-name">{result.mandi}</h2>
          <PriceMovementBadge history={history} t={t} />
        </div>

        {/* Test-data badge */}
        {isTestData && (
          <span className="badge badge-test">[{t('test_data_badge')}]</span>
        )}

        {/* Price block */}
        {result.no_rate_reported ? (
          <p className="no-rate-text">{t('no_rate_reported')}</p>
        ) : (
          <div className="price-block">
            <div className="price-modal">
              <span className="price-label">{t('modal_price')}:</span>{' '}
              <span className="price-value">{formatPrice(result.modal_price)}</span>
              <span className="price-unit"> / quintal</span>
            </div>
            <div className="price-minmax">
              <span>
                {t('min_price')}: <strong>{formatPrice(result.min_price)}</strong>
              </span>
              <span>
                {t('max_price')}: <strong>{formatPrice(result.max_price)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Metadata row */}
        <div className="mandi-meta">
          <span>
            {t('reported_date')}: <strong>{formatDate(result.reported_date)}</strong>
          </span>
          {result.source && (
            <span className="mandi-source">
              {t('source')}: {result.source}
            </span>
          )}
        </div>

        {/* Staleness warning */}
        {result.is_stale && (
          <StalenessWarning
            reportedDate={result.reported_date}
            daysAgo={result.days_since_report}
            t={t}
          />
        )}

        {/* Expand/collapse toggle */}
        <button className="expand-btn" aria-label={t('price_trend')}>
          {t('price_trend')} {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* ── Collapsible chart section ── */}
      {expanded && (
        <div className="mandi-chart-section">
          <PriceHistoryChart commodity={commodity} mandi={result.mandi} t={t} />
        </div>
      )}
    </article>
  );
}
