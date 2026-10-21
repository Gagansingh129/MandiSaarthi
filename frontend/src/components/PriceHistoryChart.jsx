import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useHistory } from '../hooks/useMandiData';
import { formatShortDate, formatDate, formatPrice } from '../utils/formatters';
import LoadingSpinner from './LoadingSpinner';

/**
 * Custom tooltip for the price chart.
 */
function ChartTooltip({ active, payload, label, t }) {
  if (!active || !payload || !payload.length) return null;

  const entry = payload[0]?.payload;
  const fullDate = entry ? formatDate(entry.date) : label;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{fullDate}</p>
      {entry && entry.no_rate_reported ? (
        <p className="chart-tooltip-no-rate">{t ? t('no_rate_reported') : 'No rate reported'}</p>
      ) : (
        <p className="chart-tooltip-price">
          {formatPrice(payload[0]?.value)}{' '}
          <span className="chart-tooltip-unit">{t ? t('price_unit') : 'INR/Quintal'}</span>
        </p>
      )}
    </div>
  );
}

/**
 * 7-day price history line chart for a given commodity + mandi.
 *
 * Props:
 *   commodity – string
 *   mandi     – string
 *   t         – i18n translation function
 */
export default function PriceHistoryChart({ commodity, mandi, t }) {
  const { history, loading, error } = useHistory(commodity, mandi, 7);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <p className="chart-error">
        {t ? t('error') : 'Something went wrong. Please try again.'}
      </p>
    );
  }

  if (!history || history.length === 0) {
    return (
      <p className="chart-no-data">
        {t ? t('no_data') : 'No data available for this selection.'}
      </p>
    );
  }

  // Map history entries: null out price when no_rate_reported so Recharts
  // won't connect across missing values (connectNulls={false}).
  const chartData = history.map((entry) => ({
    date: entry.date,
    modal_price: entry.no_rate_reported ? null : entry.modal_price,
    no_rate_reported: entry.no_rate_reported,
  }));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `₹${v}`}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip content={<ChartTooltip t={t} />} />
          <Line
            type="monotone"
            dataKey="modal_price"
            stroke="#1a6b2f"
            strokeWidth={2}
            dot={{ r: 4, fill: '#1a6b2f' }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
