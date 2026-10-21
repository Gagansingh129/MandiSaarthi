import React, { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, AlertCircleIcon, InfoIcon, VolumeIcon } from './Icons';
import { formatPrice } from '../utils/formatters';
import { speakMarketSummary } from '../utils/speech';

const STORAGE_KEY = 'mandisaarthi_price_alerts';

export default function PriceAlertsSection({
  commodity,
  mandi,
  currentModalPrice,
  lang = 'en',
  t,
}) {
  const [alerts, setAlerts] = useState([]);
  const [targetPrice, setTargetPrice] = useState('');
  const [triggeredNotice, setTriggeredNotice] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAlerts(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage whenever alerts change
  function saveAlerts(newAlerts) {
    setAlerts(newAlerts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
    } catch {
      // ignore
    }
  }

  // Check for triggered alerts whenever currentModalPrice or commodity changes
  useEffect(() => {
    if (!currentModalPrice || !commodity) return;

    alerts.forEach((a) => {
      if (
        a.commodity.toLowerCase() === commodity.toLowerCase() &&
        currentModalPrice >= a.targetPrice &&
        !a.notified
      ) {
        setTriggeredNotice({
          commodity: a.commodity,
          mandi: a.mandi,
          targetPrice: a.targetPrice,
          currentPrice: currentModalPrice,
        });

        // Browser push notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('MandiSaarthi Price Alert! 🌾', {
            body: `${a.commodity} has reached ₹${currentModalPrice} at ${a.mandi} (Target: ₹${a.targetPrice})`,
            icon: '/favicon.svg',
          });
        }
      }
    });
  }, [currentModalPrice, commodity, alerts]);

  function handleRequestNotification() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  function handleAddAlert(e) {
    e.preventDefault();
    const target = parseFloat(targetPrice);
    if (!target || target <= 0 || !commodity || !mandi) return;

    handleRequestNotification();

    const newAlert = {
      id: Date.now().toString(),
      commodity,
      mandi,
      targetPrice: target,
      createdAt: new Date().toISOString(),
      notified: false,
    };

    saveAlerts([newAlert, ...alerts]);
    setTargetPrice('');
  }

  function handleDeleteAlert(id) {
    saveAlerts(alerts.filter((a) => a.id !== id));
  }

  function handleVoiceAlertNotice() {
    if (!triggeredNotice) return;
    const speechText =
      lang === 'hi'
        ? `अलर्ट सूचना: बधाई! ${triggeredNotice.mandi} में ${triggeredNotice.commodity} का भाव आपके तय लक्ष्य ₹${Math.round(triggeredNotice.targetPrice)} को पार कर ₹${Math.round(triggeredNotice.currentPrice)} प्रति क्विंटल पहुंच गया है!`
        : `Alert notice: Great news! ${triggeredNotice.commodity} at ${triggeredNotice.mandi} has crossed your target price of ₹${Math.round(triggeredNotice.targetPrice)}, reaching ₹${Math.round(triggeredNotice.currentPrice)} per quintal!`;
    speakMarketSummary(speechText, lang);
  }

  // Filter alerts relevant to the currently selected crop
  const relevantAlerts = alerts.filter(
    (a) => a.commodity.toLowerCase() === (commodity || '').toLowerCase()
  );

  return (
    <section className="alerts-card card" style={{ marginTop: '20px' }}>
      <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellIcon className="icon-title-svg" style={{ color: '#d97706' }} />
            <span>{lang === 'hi' ? 'मूल्य लक्ष्य अलर्ट (Price Crossing Alert)' : 'Target Price Crossing Alerts'}</span>
          </h2>
          <p className="section-subtitle" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {lang === 'hi'
              ? 'अपना लक्षित विक्रय भाव दर्ज करें। भाव लक्ष्य पार करते ही तुरंत अलर्ट पाएं।'
              : 'Set your target selling rate. Get instant in-app, voice, and browser alerts when prices cross.'}
          </p>
        </div>
      </div>

      {/* Triggered Celebration Banner */}
      {triggeredNotice && (
        <div
          style={{
            background: '#ecfdf5',
            border: '2px solid #16a34a',
            borderRadius: '10px',
            padding: '14px 18px',
            margin: '14px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🎉</span>
            <div>
              <strong style={{ color: '#166534', fontSize: '1rem' }}>
                {lang === 'hi' ? 'मूल्य लक्ष्य प्राप्त!' : 'Target Price Crossed!'}
              </strong>
              <div style={{ color: '#1e293b', fontSize: '0.9rem' }}>
                <strong>{triggeredNotice.commodity}</strong> @ {triggeredNotice.mandi} has reached{' '}
                <span style={{ color: '#15803d', fontWeight: 800 }}>{formatPrice(triggeredNotice.currentPrice)}/qtl</span>{' '}
                (Target: {formatPrice(triggeredNotice.targetPrice)})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleVoiceAlertNotice}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔊 {lang === 'hi' ? 'अलर्ट सुनें' : 'Listen'}
            </button>
            <button
              type="button"
              onClick={() => setTriggeredNotice(null)}
              style={{
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Set Alert Form */}
      {commodity && mandi && (
        <form className="alert-create-form" onSubmit={handleAddAlert} style={{ margin: '14px 0' }}>
          <div className="alert-input-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <div className="alert-context-pill" style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
              🌾 {commodity} @ {mandi}
            </div>
            <div className="input-prefix-wrapper" style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px' }}>
              <span className="input-prefix" style={{ fontWeight: 700, color: '#64748b' }}>₹</span>
              <input
                type="number"
                min="100"
                step="50"
                placeholder={lang === 'hi' ? 'लक्षित मोडल भाव (₹/क्विंटल)' : 'Target Price (₹/Quintal)'}
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="styled-target-input"
                style={{ border: 'none', outline: 'none', padding: '8px', fontWeight: 700, width: '180px' }}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-set-alert"
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <BellIcon className="icon-btn-mini" style={{ width: '16px', height: '16px' }} />
              <span>{lang === 'hi' ? 'अलर्ट सेट करें' : 'Set Price Alert'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Active Alerts List */}
      <div className="alerts-list">
        {relevantAlerts.length === 0 ? (
          <p className="no-alerts-msg" style={{ color: '#64748b', fontSize: '0.88rem', fontStyle: 'italic' }}>
            {lang === 'hi' ? 'इस फसल के लिए कोई अलर्ट सेट नहीं है।' : 'No price alerts configured for this crop yet.'}
          </p>
        ) : (
          relevantAlerts.map((a) => {
            const isMet =
              currentModalPrice !== null &&
              currentModalPrice !== undefined &&
              currentModalPrice >= a.targetPrice;

            return (
              <div
                key={a.id}
                className={`alert-item-box ${isMet ? 'alert-met' : 'alert-pending'}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isMet ? '#ecfdf5' : '#f8fafc',
                  border: isMet ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}
              >
                <div className="alert-item-info">
                  <div className="alert-commodity-row" style={{ fontWeight: 700, color: '#1e293b' }}>
                    {a.commodity} — {a.mandi}
                  </div>
                  <div className="alert-price-row" style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Target: <strong>{formatPrice(a.targetPrice)}</strong> / qtl
                    {currentModalPrice !== null && (
                      <span className="current-sub" style={{ marginLeft: '6px', color: isMet ? '#15803d' : '#64748b', fontWeight: 600 }}>
                        (Current: {formatPrice(currentModalPrice)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="alert-item-status" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isMet ? (
                    <span
                      style={{
                        background: '#16a34a',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckIcon style={{ width: '12px', height: '12px' }} />
                      {lang === 'hi' ? 'लक्ष्य पार!' : 'Target Crossed!'}
                    </span>
                  ) : (
                    <span
                      style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <AlertCircleIcon style={{ width: '12px', height: '12px' }} />
                      {lang === 'hi' ? 'प्रतीक्षा में' : 'Waiting'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="alert-delete-btn"
                    onClick={() => handleDeleteAlert(a.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: '0 4px',
                    }}
                    title="Remove alert"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="alert-disclaimer-box" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', color: '#64748b', fontSize: '0.8rem' }}>
        <InfoIcon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
        <p style={{ margin: 0 }}>
          {lang === 'hi'
            ? 'अलर्ट आपके ब्राउज़र में सुरक्षित रहते हैं और लाइव डेटा अपडेट के साथ जांचे जाते हैं।'
            : 'Alerts are monitored in real-time as official market price updates arrive.'}
        </p>
      </div>
    </section>
  );
}
