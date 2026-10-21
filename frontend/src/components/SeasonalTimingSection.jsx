import React from 'react';
import { SparklesIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon, InfoIcon, VolumeIcon } from './Icons';
import { formatPrice } from '../utils/formatters';
import { speakMarketSummary } from '../utils/speech';

// Crop seasonal benchmarks & harvest patterns in India
const SEASONAL_INSIGHTS = {
  Wheat: {
    peakArrivals: 'April - May (Post-Rabi harvest)',
    leanSeason: 'November - February',
    storageDurability: 'High (up to 12 months in dry storage)',
    driver: 'Government MSP procurement and mill demand drive off-season price increases.',
  },
  Onion: {
    peakArrivals: 'March - May (Rabi harvest) & November - December (Kharif)',
    leanSeason: 'July - October',
    storageDurability: 'Moderate for Rabi stock, Low for Kharif (prone to moisture rot)',
    driver: 'Pre-monsoon storage release and seasonal festival demand create high volatility.',
  },
  Potato: {
    peakArrivals: 'February - April',
    leanSeason: 'August - November',
    storageDurability: 'High with cold storage facilities',
    driver: 'Cold storage loading in March-April and steady release until Diwali festivals.',
  },
  Tomato: {
    peakArrivals: 'Multiple cycles (January-March & July-September)',
    leanSeason: 'May - June & October - November',
    storageDurability: 'Very Low (perishable within 5-7 days)',
    driver: 'Perishable crop with rapid price swings based on monsoon rain and transport disruptions.',
  },
};

export default function SeasonalTimingSection({
  commodity,
  mandi,
  currentPrice,
  history = [],
  lang = 'en',
  t,
}) {
  if (!currentPrice || currentPrice <= 0) return null;

  // Calculate 30-day average and price range from history
  const validPrices = history
    .filter((h) => !h.no_rate_reported && h.modal_price)
    .map((h) => h.modal_price);

  const avgPrice =
    validPrices.length > 0
      ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
      : currentPrice;

  const minHistory = validPrices.length > 0 ? Math.min(...validPrices) : currentPrice * 0.95;
  const maxHistory = validPrices.length > 0 ? Math.max(...validPrices) : currentPrice * 1.05;

  // Difference vs average
  const pctDiff = ((currentPrice - avgPrice) / avgPrice) * 100;

  // Determine Seasonal Verdict
  let verdictKey = 'hold';
  let verdictColor = '#b45309'; // amber
  let verdictBg = '#fef3c7';
  let verdictTitle = lang === 'hi' ? 'स्थिर समय — बाजार सामान्य है' : 'Moderate Window — Stable Market';
  let verdictDesc =
    lang === 'hi'
      ? `वर्तमान भाव ₹${Math.round(currentPrice)} पिछले 30 दिनों के औसत (₹${Math.round(avgPrice)}) के करीब है। यदि आपको तुरंत नकदी की आवश्यकता है तो बेच सकते हैं।`
      : `Current price of ₹${Math.round(currentPrice)} is close to the recent 30-day average (₹${Math.round(avgPrice)}). Favourable for immediate cash flow needs.`;

  if (pctDiff >= 3) {
    verdictKey = 'sell';
    verdictColor = '#15803d'; // green
    verdictBg = '#ecfdf5';
    verdictTitle = lang === 'hi' ? 'उत्तम समय — बेचने की सिफारिश!' : 'Favourable Time — Good to Sell!';
    verdictDesc =
      lang === 'hi'
        ? `वर्तमान भाव 30 दिनों के औसत से ${Math.abs(pctDiff).toFixed(1)}% अधिक है। बाजार में मजबूत मांग है, यह फसल बेचने का अच्छा अवसर है।`
        : `Current price is ${Math.abs(pctDiff).toFixed(1)}% above the recent 30-day average. Solid demand makes this an attractive selling opportunity.`;
  } else if (pctDiff <= -3) {
    verdictKey = 'wait';
    verdictColor = '#b91c1c'; // red
    verdictBg = '#fef2f2';
    verdictTitle = lang === 'hi' ? 'कम भाव काल — यदि संभव हो तो रुकें' : 'Glut Period — Hold if Storage Available';
    verdictDesc =
      lang === 'hi'
        ? `वर्तमान भाव 30 दिनों के औसत से ${Math.abs(pctDiff).toFixed(1)}% नीचे चल रहा है। आवक अधिक होने से भाव दबाव में हैं। यदि सुरक्षित भंडारण उपलब्ध है तो प्रतीक्षा करें।`
        : `Current price is running ${Math.abs(pctDiff).toFixed(1)}% below recent averages due to heavy arrivals. If dry or cold storage is accessible, consider holding.`;
  }

  const cropMeta = SEASONAL_INSIGHTS[commodity] || {
    peakArrivals: 'Post-harvest season',
    leanSeason: 'Off-season period',
    storageDurability: 'Standard agricultural storage',
    driver: 'Supply and demand balance across regional APMC mandis.',
  };

  function handleListenAdvice() {
    const speechText =
      lang === 'hi'
        ? `मौसमी सलाह: क्या यह ${commodity} बेचने का सही समय है? हमारा विश्लेषण: ${verdictTitle}। ${verdictDesc}`
        : `Seasonal Advice: Is this a good time to sell ${commodity}? Verdict: ${verdictTitle}. ${verdictDesc}`;
    speakMarketSummary(speechText, lang);
  }

  return (
    <section className="seasonal-timing-card card" style={{ marginTop: '20px' }}>
      <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SparklesIcon className="icon-title-svg" style={{ color: '#d97706' }} />
            <span>{lang === 'hi' ? 'मौसमी रुझान: क्या यह बेचने का सही समय है?' : 'Seasonal Timing: Is This a Good Time to Sell?'}</span>
          </h2>
          <p className="section-subtitle" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {lang === 'hi'
              ? `${mandi} में ऐतिहासिक मूल्य बैंड और आवक चक्र का विश्लेषण`
              : `Historical price bands & arrival cycle analysis for ${mandi}`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleListenAdvice}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ecfdf5',
            color: '#166534',
            border: '1px solid #86efac',
            borderRadius: '9999px',
            padding: '6px 14px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          title="Listen in Voice"
        >
          <VolumeIcon style={{ width: '16px', height: '16px' }} />
          <span>{lang === 'hi' ? 'सलाह सुनें' : 'Listen Advice'}</span>
        </button>
      </div>

      {/* Main Verdict Banner */}
      <div
        style={{
          background: verdictBg,
          border: `1.5px solid ${verdictColor}`,
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '16px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          {pctDiff >= 3 ? (
            <TrendingUpIcon style={{ width: '24px', height: '24px', color: verdictColor }} />
          ) : pctDiff <= -3 ? (
            <TrendingDownIcon style={{ width: '24px', height: '24px', color: verdictColor }} />
          ) : (
            <MinusIcon style={{ width: '24px', height: '24px', color: verdictColor }} />
          )}
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: verdictColor, fontWeight: 700 }}>
            {verdictTitle}
          </h3>
        </div>
        <p style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {verdictDesc}
        </p>
      </div>

      {/* Benchmarks Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            {lang === 'hi' ? 'वर्तमान मोडल भाव' : 'Current Modal Price'}
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
            {formatPrice(currentPrice)}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}> / qtl</span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            {lang === 'hi' ? '30-दिवसीय औसत' : '30-Day Moving Avg'}
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#334155', marginTop: '2px' }}>
            {formatPrice(avgPrice)}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}> / qtl</span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            {lang === 'hi' ? 'मासिक भाव दायरा' : 'Monthly Price Range'}
          </span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>
            {formatPrice(minHistory)} – {formatPrice(maxHistory)}
          </div>
        </div>
      </div>

      {/* Crop Cycle Knowledge Box */}
      <div
        style={{
          background: '#f0fdf4',
          borderRadius: '8px',
          padding: '12px 16px',
          border: '1px solid #bbf7d0',
          fontSize: '0.88rem',
          lineHeight: '1.5',
          color: '#166534',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
          <InfoIcon style={{ width: '16px', height: '16px' }} />
          <span>{lang === 'hi' ? `${commodity} का मौसमी फसल चक्र` : `${commodity} Seasonal Dynamics`}</span>
        </div>
        <div><strong>Peak Harvest Arrivals:</strong> {cropMeta.peakArrivals}</div>
        <div><strong>Storage Durability:</strong> {cropMeta.storageDurability}</div>
        <div style={{ marginTop: '4px', fontSize: '0.84rem', color: '#15803d' }}>
          💡 {cropMeta.driver}
        </div>
      </div>
    </section>
  );
}
