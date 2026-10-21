import React, { useState } from 'react';
import { TruckIcon, InfoIcon, TrendingUpIcon, VolumeIcon } from './Icons';
import { formatPrice } from '../utils/formatters';
import { speakMarketSummary } from '../utils/speech';

export default function NetReturnCalculator({
  results = [],
  commodity,
  lang = 'en',
  t,
}) {
  const [quantity, setQuantity] = useState(50); // Default 50 quintals
  const [ratePerKm, setRatePerKm] = useState(35); // ₹35 per km truck/tempo rate
  // Per-mandi state: { [mandiName]: { distanceKm: number, customTransport: number } }
  const [mandiParams, setMandiParams] = useState({});

  if (!results || results.length === 0) return null;

  // Filter mandis that have an active reported modal price
  const validMandis = results.filter((r) => !r.no_rate_reported && r.modal_price !== null);
  if (validMandis.length === 0) return null;

  function handleDistanceChange(mandiName, val) {
    const km = Math.max(0, parseFloat(val) || 0);
    setMandiParams((prev) => ({
      ...prev,
      [mandiName]: {
        ...(prev[mandiName] || {}),
        distanceKm: km,
        customTransport: km * ratePerKm,
      },
    }));
  }

  function handleCustomTransportChange(mandiName, val) {
    const cost = Math.max(0, parseFloat(val) || 0);
    setMandiParams((prev) => ({
      ...prev,
      [mandiName]: {
        ...(prev[mandiName] || {}),
        customTransport: cost,
      },
    }));
  }

  // Pre-seed demo scenario: "60 km vs Local Mandi"
  function applyDemoDistanceTrap() {
    if (validMandis.length >= 2) {
      const sorted = [...validMandis].sort((a, b) => (b.modal_price || 0) - (a.modal_price || 0));
      const highMandi = sorted[0].mandi; // Higher price mandi
      const localMandi = sorted[1].mandi; // Slightly lower price mandi

      setMandiParams({
        [localMandi]: { distanceKm: 10, customTransport: 10 * ratePerKm },
        [highMandi]: { distanceKm: 60, customTransport: 60 * ratePerKm },
      });
    } else if (validMandis.length === 1) {
      setMandiParams({
        [validMandis[0].mandi]: { distanceKm: 15, customTransport: 15 * ratePerKm },
      });
    }
  }

  // Calculations for each mandi
  const calculations = validMandis.map((m, idx) => {
    const price = m.modal_price || 0;
    const gross = quantity * price;

    const currentParams = mandiParams[m.mandi] || {};
    // Default distances: local ~10km, other mandis ~25km, 40km if unspecified
    const defaultDist = idx === 0 ? 10 : 25 + idx * 15;
    const distKm = currentParams.distanceKm !== undefined ? currentParams.distanceKm : defaultDist;
    const transport =
      currentParams.customTransport !== undefined
        ? currentParams.customTransport
        : distKm * ratePerKm;

    const net = gross - transport;
    const effectivePerQtl = quantity > 0 ? net / quantity : 0;

    return {
      mandi: m.mandi,
      modal_price: price,
      distKm,
      gross,
      transport,
      net,
      effectivePerQtl,
      reported_date: m.reported_date,
    };
  });

  // Find mandi with highest net proceeds
  const bestCalculation = calculations.reduce(
    (best, cur) => (cur.net > best.net ? cur : best),
    calculations[0]
  );

  // Detect "Distance vs Price Trap":
  // A mandi has higher nominal price than the best net mandi, but worse net return due to distance!
  const trapCases = calculations.filter(
    (c) => c.modal_price > bestCalculation.modal_price && c.net < bestCalculation.net
  );

  // Or check any pair where higher price gives lower net return
  const primaryTrap =
    trapCases.length > 0
      ? trapCases[0]
      : calculations.find((c) => {
          const lowerPriceMandi = calculations.find(
            (other) => other.modal_price < c.modal_price && other.net > c.net
          );
          return !!lowerPriceMandi;
        });

  const comparisonPartner = primaryTrap
    ? calculations.find(
        (other) => other.modal_price < primaryTrap.modal_price && other.net > primaryTrap.net
      ) || bestCalculation
    : null;

  function handleListenCalculator() {
    let speechText = '';
    if (primaryTrap && comparisonPartner) {
      const netLoss = comparisonPartner.net - primaryTrap.net;
      speechText =
        lang === 'hi'
          ? `सावधान किसान भाई! ${primaryTrap.mandi} में भाव अधिक है, लेकिन ${primaryTrap.distKm} किलोमीटर दूर होने के कारण ट्रांसपोर्ट में खर्च अधिक होगा। ${comparisonPartner.mandi} में बेचने पर आपको कुल ₹${Math.round(netLoss)} अधिक शुद्ध बचत होगी। पास की मंडी ही बेहतर सौदा है।`
          : `Important farmer alert: ${primaryTrap.mandi} has a higher nominal rate, but is ${primaryTrap.distKm} kilometers away. Hauling costs reduce your take-home by ₹${Math.round(netLoss)} compared to ${comparisonPartner.mandi}. Selling locally is the smarter choice!`;
    } else {
      speechText =
        lang === 'hi'
          ? `ट्रांसपोर्ट के बाद सबसे अधिक शुद्ध मुनाफा ${bestCalculation.mandi} में है, जहां ${quantity} क्विंटल फसल पर अनुमानित शुद्ध कमाई ₹${Math.round(bestCalculation.net)} होगी।`
          : `After transport expenses, the highest net return is at ${bestCalculation.mandi}, offering an estimated take-home of ₹${Math.round(bestCalculation.net)} for ${quantity} quintals.`;
    }
    speakMarketSummary(speechText, lang);
  }

  return (
    <section className="calculator-card card" style={{ marginTop: '20px' }}>
      <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TruckIcon className="icon-title-svg" style={{ color: '#047857' }} />
            <span>{lang === 'hi' ? 'दूरी और ट्रांसपोर्ट खर्च बनाम शुद्ध मुनाफा' : 'Transport Cost & Net Return Evaluator'}</span>
          </h2>
          <p className="section-subtitle" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {lang === 'hi'
              ? 'क्या 60 किमी दूर ₹100 अधिक भाव वास्तव में फायदेमंद है? अपना शुद्ध हाथ में आने वाला पैसा जांचें।'
              : 'Does a higher rate 60 km away actually give you more money? Verify true take-home proceeds after hauling.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={applyDemoDistanceTrap}
            style={{
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Simulate 60km vs 10km scenario"
          >
            ⚡ {lang === 'hi' ? '60 किमी बनाम स्थानीय डेमो' : 'Simulate 60km vs Local'}
          </button>

          <button
            type="button"
            onClick={handleListenCalculator}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ecfdf5',
              color: '#166534',
              border: '1px solid #86efac',
              borderRadius: '9999px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Listen Analysis"
          >
            <VolumeIcon style={{ width: '16px', height: '16px' }} />
            <span>{lang === 'hi' ? 'सुने' : 'Listen'}</span>
          </button>
        </div>
      </div>

      {/* Global Inputs Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          background: '#f8fafc',
          padding: '14px 16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          margin: '14px 0',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            {lang === 'hi' ? 'फसल की मात्रा (क्विंटल)' : 'Harvest Quantity (Quintals):'}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              min="1"
              max="5000"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{
                width: '100px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            />
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Qtl (100 kg/qtl)</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            {lang === 'hi' ? 'ट्रक / टेंपो दर (₹ प्रति किमी)' : 'Estimated Vehicle Rate (₹ / km):'}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, color: '#64748b' }}>₹</span>
            <input
              type="number"
              min="5"
              max="200"
              value={ratePerKm}
              onChange={(e) => setRatePerKm(Math.max(5, parseInt(e.target.value, 10) || 35))}
              style={{
                width: '100px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            />
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>per km round-trip</span>
          </div>
        </div>
      </div>

      {/* ⚠️ HIGH VISIBILITY DISTANCE TRAP WARNING CALLOUT */}
      {primaryTrap && comparisonPartner && (
        <div
          style={{
            background: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.3rem' }}>🚨</span>
            <span>
              {lang === 'hi'
                ? 'सतर्कता चेतावनी: अधिक भाव लेकिन घाटे का सौदा!'
                : 'Reality Check: Higher Rate is Actually the WORSE Deal!'}
            </span>
          </div>
          <p style={{ margin: 0, color: '#1e293b', fontSize: '0.94rem', lineHeight: '1.6' }}>
            {lang === 'hi' ? (
              <>
                <strong>{primaryTrap.mandi}</strong> में भाव{' '}
                <strong>₹{Math.round(primaryTrap.modal_price - comparisonPartner.modal_price)}/क्विंटल अधिक</strong> है।
                लेकिन <strong>{primaryTrap.distKm} किमी</strong> दूर जाने पर अतिरिक्त ट्रांसपोर्ट खर्च{' '}
                <strong>₹{Math.round(primaryTrap.transport - comparisonPartner.transport).toLocaleString('en-IN')}</strong> लगेगा।
                <br />
                👉 परिणाम: पास की मंडी <strong>{comparisonPartner.mandi}</strong> ({comparisonPartner.distKm} किमी) में बेचने पर आपके हाथ में{' '}
                <strong style={{ color: '#15803d' }}>
                  ₹{Math.round(comparisonPartner.net - primaryTrap.net).toLocaleString('en-IN')} अधिक शुद्ध लाभ
                </strong>{' '}
                आएगा!
              </>
            ) : (
              <>
                <strong>{primaryTrap.mandi}</strong> appears tempting with a higher rate (+
                ₹{Math.round(primaryTrap.modal_price - comparisonPartner.modal_price)}/qtl). However, travelling{' '}
                <strong>{primaryTrap.distKm} km</strong> adds{' '}
                <strong>₹{Math.round(primaryTrap.transport - comparisonPartner.transport).toLocaleString('en-IN')}</strong>{' '}
                in hauling expenses.
                <br />
                👉 Bottom Line: Selling at local <strong>{comparisonPartner.mandi}</strong> ({comparisonPartner.distKm} km) puts{' '}
                <strong style={{ color: '#15803d' }}>
                  ₹{Math.round(comparisonPartner.net - primaryTrap.net).toLocaleString('en-IN')} MORE net cash
                </strong>{' '}
                directly in your pocket! 💡 <em>Sahi Mandi, Behtar Faisla.</em>
              </>
            )}
          </p>
        </div>
      )}

      {/* Comparison Calculation Cards Grid */}
      <div className="calc-results-grid">
        {calculations.map((c) => {
          const isBest = c.mandi === bestCalculation.mandi && calculations.length > 1;
          const advantage = isBest ? 0 : bestCalculation.net - c.net;
          const isWorseDespiteHighPrice = primaryTrap && c.mandi === primaryTrap.mandi;

          return (
            <div
              key={c.mandi}
              className={`calc-mandi-card ${isBest ? 'calc-mandi-best' : ''}`}
              style={{
                border: isBest
                  ? '2px solid #16a34a'
                  : isWorseDespiteHighPrice
                  ? '2px solid #f59e0b'
                  : '1px solid #e2e8f0',
                background: isBest ? '#f0fdf4' : '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                position: 'relative',
              }}
            >
              <div className="calc-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 className="calc-mandi-title" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{c.mandi}</h3>
                {isBest ? (
                  <span
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <TrendingUpIcon style={{ width: '12px', height: '12px' }} />
                    {lang === 'hi' ? 'सर्वोत्तम शुद्ध लाभ' : 'Best Net Return'}
                  </span>
                ) : isWorseDespiteHighPrice ? (
                  <span
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      border: '1px solid #fcd34d',
                    }}
                  >
                    ⚠️ {lang === 'hi' ? 'दूरी का घाटा' : 'Worse Due to Distance'}
                  </span>
                ) : null}
              </div>

              {/* Price & Gross */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '0.85rem' }}>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Reported Rate</div>
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>{formatPrice(c.modal_price)} / qtl</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Gross ({quantity} Qtl)</div>
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>{formatPrice(c.gross)}</div>
                </div>
              </div>

              {/* Distance & Transport Inputs */}
              <div style={{ background: '#f1f5f9', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor={`dist-${c.mandi}`} style={{ fontWeight: 600, color: '#334155' }}>
                    {lang === 'hi' ? 'खेत से दूरी (किमी):' : 'Distance from Farm (km):'}
                  </label>
                  <input
                    id={`dist-${c.mandi}`}
                    type="number"
                    min="1"
                    max="500"
                    value={c.distKm}
                    onChange={(e) => handleDistanceChange(c.mandi, e.target.value)}
                    style={{ width: '60px', padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor={`transport-${c.mandi}`} style={{ fontWeight: 600, color: '#334155' }}>
                    {lang === 'hi' ? 'कुल ट्रांसपोर्ट खर्च (₹):' : 'Hauling Cost (₹ Total):'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '2px' }}>₹</span>
                    <input
                      id={`transport-${c.mandi}`}
                      type="number"
                      min="0"
                      value={Math.round(c.transport)}
                      onChange={(e) => handleCustomTransportChange(c.mandi, e.target.value)}
                      style={{ width: '70px', padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              {/* Net Proceeds Box */}
              <div
                style={{
                  background: isBest ? '#dcfce7' : '#f8fafc',
                  border: isBest ? '1px solid #86efac' : '1px solid #e2e8f0',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: isBest ? '#15803d' : '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  {lang === 'hi' ? 'हाथ में आने वाला शुद्ध पैसा (Net)' : 'Estimated Net Proceeds'}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: isBest ? '#14532d' : '#0f172a', margin: '2px 0' }}>
                  {formatPrice(c.net)}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Effective Net: <strong>{formatPrice(c.effectivePerQtl)}</strong> / quintal
                </div>
              </div>

              {!isBest && advantage > 0 && (
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#b45309', fontWeight: 600, textAlign: 'center' }}>
                  {lang === 'hi'
                    ? `⚠️ ${bestCalculation.mandi} में बेचने पर ₹${Math.round(advantage).toLocaleString('en-IN')} अधिक बचत होगी`
                    : `⚠️ Selling at ${bestCalculation.mandi} yields ₹${Math.round(advantage).toLocaleString('en-IN')} more net`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Strict Disclaimer */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '14px', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
        <InfoIcon style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ margin: 0 }}>
          {lang === 'hi'
            ? 'अस्वीकरण: शुद्ध आय की गणना केवल रिपोर्ट किए गए मोडल भाव और उपयोगकर्ता द्वारा दर्ज ट्रांसपोर्ट दूरी/खर्च पर आधारित है। मंडी सेस, हम्माली व ग्रेडिंग कटौती शामिल नहीं है।'
            : 'Disclaimer: Net proceeds are indicative estimates based on reported modal rates and user-entered transport costs. Mandi cess, handling, and grade deductions at auction are not included.'}
        </p>
      </div>
    </section>
  );
}
