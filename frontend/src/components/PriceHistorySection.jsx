import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useHistory } from '../hooks/useMandiData';
import { formatShortDate, formatDate, formatPrice } from '../utils/formatters';
import { CalendarIcon, InfoIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

function CustomTooltip({ active, payload, label, t }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0]?.payload;
  const fullDate = entry ? formatDate(entry.date) : label;

  return (
    <div className="chart-tooltip-box">
      <p className="tooltip-date">{fullDate}</p>
      {entry && entry.no_rate_reported ? (
        <p className="tooltip-no-rate">⚠️ {t ? t('no_rate_reported') : 'No rate reported'}</p>
      ) : (
        <p className="tooltip-price">
          <span className="tooltip-value">{formatPrice(payload[0]?.value)}</span>
          <span className="tooltip-unit"> / quintal</span>
        </p>
      )}
    </div>
  );
}

export default function PriceHistorySection({ commodity, mandi, t }) {
  const [periodDays, setPeriodDays] = useState(7);
  const { history, loading, error } = useHistory(commodity, mandi, periodDays);

  const chartData = (history || []).map((item) => ({
    date: item.date,
    modal_price: item.no_rate_reported ? null : item.modal_price,
    no_rate_reported: item.no_rate_reported,
  }));

  const reportedEntries = (history || []).filter((h) => !h.no_rate_reported && h.modal_price !== null);
  const hasGaps = (history || []).some((h) => h.no_rate_reported);

  return (
    <section className="price-history-card card">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">{t('price_trend')}</h2>
          <p className="section-subtitle">
            {mandi} — {t('trend_subtitle')}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="period-tabs">
          <button
            type="button"
            className={`period-tab-btn ${periodDays === 7 ? 'tab-active' : ''}`}
            onClick={() => setPeriodDays(7)}
          >
            {t('period_7d')}
          </button>
          <button
            type="button"
            className={`period-tab-btn ${periodDays === 30 ? 'tab-active' : ''}`}
            onClick={() => setPeriodDays(30)}
          >
            {t('period_30d')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="chart-loading-box">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="chart-empty-box">
          <p className="error-text">⚠️ {t('error')}</p>
        </div>
      ) : chartData.length === 0 || reportedEntries.length === 0 ? (
        <div className="chart-empty-box">
          <p>{t('no_data')}</p>
        </div>
      ) : (
        <>
          <div className="chart-container-inner" style={{ width: '100%', height: 260, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  stroke="#cbd5e1"
                />
                <YAxis
                  tickFormatter={(val) => `₹${val}`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip t={t} />} />
                <Line
                  type="monotone"
                  dataKey="modal_price"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data integrity reminder badge */}
          <div className="chart-integrity-footer">
            <InfoIcon className="icon-info" />
            <span>
              {hasGaps
                ? 'Unconnected breaks on the chart reflect days with no auction or reported rate.'
                : t('data_integrity_notice')}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
