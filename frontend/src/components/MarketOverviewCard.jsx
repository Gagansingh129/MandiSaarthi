import React, { useState } from 'react';
import { formatPrice, formatDate } from '../utils/formatters';
import {
  WheatIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  VolumeIcon,
  VolumeOffIcon,
  CalendarIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from './Icons';
import { speakMarketSummary, stopSpeaking } from '../utils/speech';

export default function MarketOverviewCard({
  topMandi,
  commodity,
  history = [],
  lang,
  t,
}) {
  const [speaking, setSpeaking] = useState(false);

  if (!topMandi) return null;

  const isTestData = topMandi.source === 'Synthetic-Test';
  const hasRate = !topMandi.no_rate_reported && topMandi.modal_price !== null;

  // Determine trend from history
  const validPrices = history
    .filter((e) => !e.no_rate_reported && e.modal_price !== null && e.modal_price !== undefined)
    .map((e) => e.modal_price);

  let trendType = 'stable';
  if (validPrices.length >= 2) {
    const latest = validPrices[validPrices.length - 1];
    const prev = validPrices[validPrices.length - 2];
    if (latest > prev) trendType = 'up';
    else if (latest < prev) trendType = 'down';
  }

  function handleVoiceReadout() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }

    let speechText = '';
    const dateFormatted = formatDate(topMandi.reported_date);
    const priceFormatted = topMandi.modal_price ? `₹${Math.round(topMandi.modal_price)}` : '';

    if (lang === 'hi') {
      if (hasRate) {
        speechText = `${topMandi.mandi} में ${commodity} का मोडल भाव ${priceFormatted} प्रति क्विंटल है। रिपोर्ट तिथि ${dateFormatted} है।`;
      } else {
        speechText = `${topMandi.mandi} में ${commodity} का कोई भाव दर्ज नहीं है।`;
      }
    } else {
      if (hasRate) {
        speechText = `In ${topMandi.mandi}, the modal price for ${commodity} is reported at ${priceFormatted} per quintal as of ${dateFormatted}.`;
      } else {
        speechText = `In ${topMandi.mandi}, no rate is reported for ${commodity}.`;
      }
    }

    speakMarketSummary(
      speechText,
      lang,
      () => setSpeaking(true),
      () => setSpeaking(false),
      () => setSpeaking(false)
    );
  }

  return (
    <article className="overview-spotlight-card card">
      {/* Top Header Row */}
      <div className="overview-top-bar">
        <div className="spotlight-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/images/mandi-bazaar.svg"
            alt="Mandi Market"
            style={{ width: '46px', height: '46px', borderRadius: '10px', border: '1.5px solid #16a34a', objectFit: 'cover', background: '#ecfdf5', padding: '2px', flexShrink: 0 }}
          />
          <div>
            <span className="spotlight-kicker">
              <SparklesIcon className="icon-sparkle" />
              {t('best_opportunity')}
            </span>
            <h2 className="spotlight-mandi-name" style={{ margin: 0 }}>{topMandi.mandi}</h2>
          </div>
        </div>

        {/* Action button: Voice Readout */}
        <button
          type="button"
          className={`voice-readout-btn ${speaking ? 'btn-speaking' : ''}`}
          onClick={handleVoiceReadout}
          aria-label={t('voice_listen')}
          title={t('voice_listen')}
        >
          {speaking ? <VolumeOffIcon className="icon-voice" /> : <VolumeIcon className="icon-voice" />}
          <span>{speaking ? t('voice_playing') : t('voice_listen')}</span>
        </button>
      </div>

      {/* Main Metric Display */}
      <div className="overview-main-metric">
        {hasRate ? (
          <div className="price-huge-block">
            <span className="price-currency-symbol">₹</span>
            <span className="price-big-number">
              {Number(topMandi.modal_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="price-big-unit">{t('price_unit')}</span>
          </div>
        ) : (
          <div className="no-rate-notice">
            <span className="no-rate-title">{t('no_rate_reported')}</span>
          </div>
        )}

        {/* Trend Indicator Badge */}
        {hasRate && (
          <div className={`metric-trend-badge trend-${trendType}`}>
            {trendType === 'up' && <TrendingUpIcon className="icon-trend" />}
            {trendType === 'down' && <TrendingDownIcon className="icon-trend" />}
            {trendType === 'stable' && <MinusIcon className="icon-trend" />}
            <span>
              {trendType === 'up'
                ? t('trend_up')
                : trendType === 'down'
                ? t('trend_down')
                : t('trend_stable')}
            </span>
          </div>
        )}
      </div>

      {/* Min - Max Range Bar (if prices present) */}
      {hasRate && topMandi.min_price && topMandi.max_price && (
        <div className="price-range-wrapper">
          <div className="range-labels">
            <span>
              {t('min_price')}: <strong>{formatPrice(topMandi.min_price)}</strong>
            </span>
            <span className="range-center-label">Auction Range</span>
            <span>
              {t('max_price')}: <strong>{formatPrice(topMandi.max_price)}</strong>
            </span>
          </div>
          <div className="range-track">
            <div className="range-progress" />
          </div>
        </div>
      )}

      {/* Freshness & Staleness Notification */}
      <div className="overview-freshness-bar">
        <div className="freshness-info">
          <CalendarIcon className="icon-meta" />
          <span>
            {t('reported_date')}: <strong>{formatDate(topMandi.reported_date)}</strong>
          </span>
          {topMandi.is_stale ? (
            <span className="tag-staleness-warning">
              ⚠️ {t('stale_warning').replace('{date}', formatDate(topMandi.reported_date))}
              {topMandi.days_since_report > 0 && ` (${topMandi.days_since_report} days ago)`}
            </span>
          ) : (
            <span className="tag-fresh-today">✓ {t('today_badge')}</span>
          )}
        </div>

        {/* Source verification tag */}
        <div className="source-verification-tag">
          {isTestData ? (
            <span className="badge-synthetic">[{t('synthetic_badge')}]</span>
          ) : (
            <span className="badge-official">
              <ShieldCheckIcon className="icon-shield-mini" />
              {t('verified_source')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
