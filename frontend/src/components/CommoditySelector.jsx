import React from 'react';
import { useCommodities } from '../hooks/useMandiData';
import LoadingSpinner from './LoadingSpinner';

/**
 * Dropdown for selecting a commodity (crop).
 * Option labels are always bilingual: "[name_hi] / [name]"
 *
 * Props:
 *   value    – currently selected commodity name (English)
 *   onChange – callback(name) when selection changes
 *   t        – i18n translation function
 */
export default function CommoditySelector({ value, onChange, t }) {
  const { commodities, loading, error } = useCommodities();

  return (
    <div className="selector-wrapper">
      <label htmlFor="commodity-select" className="selector-label">
        {t('select_commodity')}
      </label>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="selector-error">{t('error')}</p>
      ) : (
        <select
          id="commodity-select"
          className="selector"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            — {t('select_commodity')} —
          </option>
          {commodities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name_hi} / {c.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
