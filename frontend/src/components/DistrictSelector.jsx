import React from 'react';
import { useDistricts } from '../hooks/useMandiData';
import LoadingSpinner from './LoadingSpinner';

/**
 * Dropdown for selecting a district (filtered by selected commodity).
 *
 * Props:
 *   commodity – currently selected commodity name (enables the selector)
 *   value     – currently selected district name
 *   onChange  – callback({ district, state }) when selection changes
 *   t         – i18n translation function
 */
export default function DistrictSelector({ commodity, value, state, onChange, t }) {
  const { districts, loading, error } = useDistricts(commodity);

  const isDisabled = !commodity;
  const compositeValue = value && state ? `${value}|||${state}` : (value || '');

  function handleChange(e) {
    const [district, districtState] = e.target.value.split('|||');
    if (district) onChange({ district, state: districtState });
  }

  return (
    <div className="selector-wrapper">
      <label htmlFor="district-select" className="selector-label">
        {t('select_district')}
      </label>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="selector-error">{t('error')}</p>
      ) : (
        <select
          id="district-select"
          className="selector"
          value={compositeValue}
          onChange={handleChange}
          disabled={isDisabled}
        >
          <option value="" disabled>
            {isDisabled
              ? `— ${t('select_commodity')} first —`
              : `— ${t('select_district')} —`}
          </option>
          {districts.map((d) => (
            <option key={`${d.district}-${d.state}`} value={`${d.district}|||${d.state}`}>
              {d.district}, {d.state}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
