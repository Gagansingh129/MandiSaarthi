import React, { useState } from 'react';
import MandiCard from './MandiCard';

/**
 * Responsive grid of MandiCard components.
 *
 * Props:
 *   results   – array from /prices/latest
 *   commodity – string
 *   district  – string (for summary line)
 *   t         – i18n translation function
 */
export default function MandiCompareGrid({ results, commodity, district, t }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!results || results.length === 0) {
    return (
      <div className="no-data-message">
        <p>{t('no_data')}</p>
      </div>
    );
  }

  function handleExpand(index, isExpanded) {
    setExpandedIndex(isExpanded ? index : null);
  }

  return (
    <section className="compare-section">
      <p className="compare-summary">
        {results.length} {t('mandi_label')}
        {district ? ` — ${district}` : ''}
      </p>
      <div className="grid-2col">
        {results.map((result, idx) => (
          <MandiCard
            key={`${result.mandi}-${idx}`}
            result={result}
            commodity={commodity}
            expanded={expandedIndex === idx}
            onExpand={(isExpanded) => handleExpand(idx, isExpanded)}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}
