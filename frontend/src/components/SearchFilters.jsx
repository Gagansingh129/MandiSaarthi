import React, { useState, useMemo } from 'react';
import { useCommodities, useDistricts } from '../hooks/useMandiData';
import { SearchIcon, MapPinIcon, ChevronDownIcon, WheatIcon } from './Icons';

export default function SearchFilters({
  selectedCommodity,
  onCommodityChange,
  selectedDistrict,
  selectedState,
  onDistrictChange,
  selectedMandi,
  onMandiChange,
  availableMandis = [],
  t,
}) {
  const { commodities, loading: loadingCommodities } = useCommodities();
  const { districts, loading: loadingDistricts } = useDistricts(selectedCommodity);

  const [commoditySearch, setCommoditySearch] = useState('');

  // Auto-select first district if none selected or if current district is invalid for the new crop
  React.useEffect(() => {
    if (districts && districts.length > 0) {
      const match = districts.some(
        (d) =>
          d.district.toLowerCase() === (selectedDistrict || '').toLowerCase() &&
          (!selectedState || d.state.toLowerCase() === (selectedState || '').toLowerCase())
      );
      if (!match) {
        onDistrictChange({ district: districts[0].district, state: districts[0].state });
      }
    }
  }, [districts, selectedCommodity]);

  const compositeDistrictVal =
    selectedDistrict && selectedState ? `${selectedDistrict}|||${selectedState}` : '';

  function handleDistrictSelect(e) {
    const val = e.target.value;
    if (!val) {
      onDistrictChange({ district: '', state: '' });
      return;
    }
    const [district, state] = val.split('|||');
    onDistrictChange({ district, state });
  }

  // Quick crop emoji/icon mapping
  const cropIcons = {
    Wheat: '🌾',
    'Wheat Atta': '🌾',
    Onion: '🧅',
    'Onion Green': '🧅',
    Tomato: '🍅',
    Potato: '🥔',
    'Sweet Potato': '🍠',
  };

  return (
    <section className="search-filters-card card">
      {/* ── Quick Crop Selector Pills ── */}
      <div className="quick-crop-bar">
        <span className="quick-crop-label">{t('select_commodity')}:</span>
        <div className="quick-crop-pills">
          {commodities.map((c) => {
            const isSelected = c.name.toLowerCase() === (selectedCommodity || '').toLowerCase();
            return (
              <button
                key={c.name}
                type="button"
                className={`crop-pill-btn ${isSelected ? 'pill-active' : ''}`}
                onClick={() => onCommodityChange(c.name)}
              >
                <span className="crop-pill-emoji">{cropIcons[c.name] || '🌱'}</span>
                <span className="crop-pill-name">
                  <strong>{c.name_hi || c.name}</strong>
                  <span className="crop-pill-en">({c.name})</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="filters-divider" />

      {/* ── District & Mandi Filter Inputs ── */}
      <div className="filters-grid">
        {/* District & State Selector */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="district-select">
            <MapPinIcon className="inline-icon" />
            <span>{t('select_district')}</span>
          </label>
          <div className="select-input-container">
            <select
              id="district-select"
              className="styled-select"
              value={compositeDistrictVal}
              onChange={handleDistrictSelect}
              disabled={!selectedCommodity || loadingDistricts}
            >
              {districts.map((d) => (
                <option key={`${d.district}-${d.state}`} value={`${d.district}|||${d.state}`}>
                  {d.district}, {d.state}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="select-arrow" />
          </div>
        </div>

        {/* Mandi Filter (Scope limiter) */}
        {availableMandis.length > 0 && (
          <div className="filter-group">
            <label className="filter-label" htmlFor="mandi-filter">
              {t('mandi_label')} ({t('all_mandis')})
            </label>
            <div className="select-input-container">
              <select
                id="mandi-filter"
                className="styled-select"
                value={selectedMandi || ''}
                onChange={(e) => onMandiChange(e.target.value)}
              >
                <option value="">{t('all_mandis')} ({availableMandis.length})</option>
                {availableMandis.map((m) => (
                  <option key={m.mandi} value={m.mandi}>
                    {m.mandi}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="select-arrow" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
