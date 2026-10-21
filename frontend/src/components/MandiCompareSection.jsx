import React, { useState } from 'react';
import { formatPrice, formatDate } from '../utils/formatters';
import {
  ScaleIcon,
  SparklesIcon,
  CalendarIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from './Icons';

export default function MandiCompareSection({
  results = [],
  commodity,
  selectedMandi,
  onSelectMandi,
  t,
}) {
  const [sortOrder, setSortOrder] = useState('high_to_low'); // 'high_to_low' | 'low_to_high'

  if (!results || results.length === 0) {
    return (
      <section className="compare-card card">
        <h2 className="section-title">{t('compare_mandis')}</h2>
        <div className="empty-state-box">
          <p>{t('no_data')}</p>
        </div>
      </section>
    );
  }

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    const pA = a.modal_price || 0;
    const pB = b.modal_price || 0;
    return sortOrder === 'high_to_low' ? pB - pA : pA - pB;
  });

  const topPrice = Math.max(...results.map((r) => r.modal_price || 0));

  return (
    <section className="compare-card card">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">
            <ScaleIcon className="icon-title-svg" />
            <span>{t('compare_mandis')}</span>
          </h2>
          <p className="section-subtitle">
            {commodity} — {results.length} mandis reporting in this scope.
          </p>
        </div>

        {/* Sort controls */}
        <div className="sort-controls">
          <button
            type="button"
            className={`sort-pill ${sortOrder === 'high_to_low' ? 'sort-active' : ''}`}
            onClick={() => setSortOrder('high_to_low')}
          >
            Price: High to Low
          </button>
          <button
            type="button"
            className={`sort-pill ${sortOrder === 'low_to_high' ? 'sort-active' : ''}`}
            onClick={() => setSortOrder('low_to_high')}
          >
            Price: Low to High
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="comparison-grid">
        {sortedResults.map((item, idx) => {
          const isTop = (item.modal_price || 0) === topPrice && topPrice > 0;
          const isSelected = selectedMandi === item.mandi;
          const hasRate = !item.no_rate_reported && item.modal_price !== null;
          const diff = topPrice > 0 && hasRate ? (item.modal_price || 0) - topPrice : 0;
          const isTestData = item.source === 'Synthetic-Test';

          return (
            <div
              key={`${item.mandi}-${idx}`}
              className={`comparison-item-card ${isTop ? 'item-top-opportunity' : ''} ${
                isSelected ? 'item-selected' : ''
              }`}
              onClick={() => onSelectMandi && onSelectMandi(item.mandi)}
            >
              <div className="item-card-header">
                <div>
                  <h3 className="item-mandi-name">{item.mandi}</h3>
                  <p className="item-mandi-sub">{item.source || 'Agmarknet'}</p>
                </div>
                {isTop && (
                  <span className="badge-best-price">
                    <SparklesIcon className="icon-badge-sparkle" />
                    {t('best_price_badge')}
                  </span>
                )}
              </div>

              {/* Price Details */}
              <div className="item-price-row">
                {hasRate ? (
                  <>
                    <div className="item-price-main">
                      <span className="item-price-val">{formatPrice(item.modal_price)}</span>
                      <span className="item-price-unit"> / qtl</span>
                    </div>
                    {!isTop && diff < 0 && (
                      <span className="item-price-diff diff-lower">
                        {formatPrice(diff)} vs best
                      </span>
                    )}
                  </>
                ) : (
                  <span className="item-no-rate">{t('no_rate_reported')}</span>
                )}
              </div>

              {/* Min Max Range */}
              {hasRate && item.min_price && item.max_price && (
                <div className="item-range-text">
                  Min {formatPrice(item.min_price)} — Max {formatPrice(item.max_price)}
                </div>
              )}

              {/* Reporting Date & Staleness Indicator */}
              <div className="item-date-row">
                <span className="item-date-text">
                  <CalendarIcon className="icon-calendar-mini" />
                  {formatDate(item.reported_date)}
                </span>
                {item.is_stale ? (
                  <span className="item-stale-tag" title="Recorded price is from a prior trading day">
                    Prior Date
                  </span>
                ) : (
                  <span className="item-fresh-tag">Today</span>
                )}
              </div>

              {isTestData && (
                <div className="synthetic-badge-container">
                  <span className="badge-synthetic">[{t('synthetic_badge')}]</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
