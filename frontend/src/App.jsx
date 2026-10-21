import React, { useState, useEffect } from 'react';
import enStrings from './i18n/en.json';
import hiStrings from './i18n/hi.json';
import { useLatestPrices, useHistory } from './hooks/useMandiData';
import { fetchHealth } from './api/mandiApi';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SearchFilters from './components/SearchFilters';
import MarketOverviewCard from './components/MarketOverviewCard';
import MandiCompareSection from './components/MandiCompareSection';
import PriceHistorySection from './components/PriceHistorySection';
import NetReturnCalculator from './components/NetReturnCalculator';
import PriceAlertsSection from './components/PriceAlertsSection';
import SeasonalTimingSection from './components/SeasonalTimingSection';
import MandiDigestSection from './components/MandiDigestSection';
import LoadingSpinner from './components/LoadingSpinner';
import { speakMarketSummary, stopSpeaking } from './utils/speech';
import { VolumeIcon, VolumeOffIcon } from './components/Icons';

const i18n = { en: enStrings, hi: hiStrings };

export default function App() {
  const [lang, setLang] = useState('en');
  const [selectedCommodity, setSelectedCommodity] = useState('Wheat');
  const [selectedDistrict, setSelectedDistrict] = useState('Agra');
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [selectedMandi, setSelectedMandi] = useState('');
  const [healthData, setHealthData] = useState(null);

  // Load system health on mount
  useEffect(() => {
    fetchHealth()
      .then((data) => setHealthData(data))
      .catch(() => setHealthData({ status: 'ok', data_source: 'csv', csv_rows: 70 }));
  }, []);

  function t(key) {
    return (i18n[lang] && i18n[lang][key]) || i18n['en'][key] || key;
  }

  function handleCommodityChange(name) {
    setSelectedCommodity(name);
    setSelectedDistrict('');
    setSelectedState('');
    setSelectedMandi('');
  }

  function handleDistrictChange({ district, state }) {
    setSelectedDistrict(district);
    setSelectedState(state);
    setSelectedMandi('');
  }

  function toggleLang() {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  }

  // Fetch latest prices for commodity + district + state
  const { data, loading, error } = useLatestPrices(
    selectedCommodity,
    selectedDistrict,
    selectedState
  );

  const rawResults = data?.results || [];

  // Filter by selected mandi if specified
  const filteredResults = selectedMandi
    ? rawResults.filter((r) => r.mandi === selectedMandi)
    : rawResults;

  // Best mandi (highest modal price)
  const topMandi =
    (selectedMandi ? rawResults.find((r) => r.mandi === selectedMandi) : null) ||
    [...rawResults].sort((a, b) => (b.modal_price || 0) - (a.modal_price || 0))[0] ||
    null;

  // Fetch 7-day history for the top/active mandi for the overview trend
  const { history: activeMandiHistory } = useHistory(
    selectedCommodity,
    topMandi?.mandi,
    7
  );

  const [masterSpeaking, setMasterSpeaking] = useState(false);

  function handleMasterVoiceReadout() {
    if (masterSpeaking) {
      stopSpeaking();
      setMasterSpeaking(false);
      return;
    }

    if (!topMandi) return;

    const rate = Math.round(topMandi.modal_price || 0);
    const speechText =
      lang === 'hi'
        ? `नमस्ते किसान भाई! मंडी सारथी की दैनिक रिपोर्ट। ${selectedDistrict} जिले में ${selectedCommodity} के लिए सबसे अच्छी मंडी ${topMandi.mandi} है। यहां आज का मोडल भाव ₹${rate} प्रति क्विंटल है। हमारा सुझाव: अधिक भाव देखकर दूर जाने से पहले ट्रांसपोर्ट खर्च अवश्य जोड़ें। 60 किलोमीटर दूर जाने पर अतिरिक्त भाड़ा आपके मुनाफे को घटा सकता है।`
        : `Welcome to MandiSaarthi! In ${selectedDistrict}, the highest selling rate for ${selectedCommodity} is at ${topMandi.mandi} with ₹${rate} per quintal. Remember: always calculate transport costs before travelling far. A higher rate 60 km away can turn into a worse deal after hauling expenses.`;

    speakMarketSummary(
      speechText,
      lang,
      () => setMasterSpeaking(true),
      () => setMasterSpeaking(false),
      () => setMasterSpeaking(false)
    );
  }

  return (
    <div className="app-root">
      {/* ── Top Navigation Bar ── */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        t={t}
        healthData={healthData}
      />

      {/* ── Hero Value Proposition Banner ── */}
      <HeroSection t={t} />

      {/* ── Main Dashboard Workspace ── */}
      <main className="container dashboard-main">
        {/* Search & Location Filters */}
        <SearchFilters
          selectedCommodity={selectedCommodity}
          onCommodityChange={handleCommodityChange}
          selectedDistrict={selectedDistrict}
          selectedState={selectedState}
          onDistrictChange={handleDistrictChange}
          selectedMandi={selectedMandi}
          onMandiChange={setSelectedMandi}
          availableMandis={rawResults}
          t={t}
        />

        {/* Loading State */}
        {loading && (
          <div className="state-card-loading card">
            <LoadingSpinner />
            <p className="loading-text">{t('loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="state-card-error card" role="alert">
            <span className="error-icon">⚠️</span>
            <div>
              <p className="error-title">{t('error')}</p>
              <p className="error-sub">{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && selectedCommodity && selectedDistrict && (
          <>
            {rawResults.length === 0 ? (
              <div className="state-card-nodata card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                <img
                  src="/images/mandi-bazaar.svg"
                  alt="No mandi records"
                  style={{ width: '120px', height: '90px', margin: '0 auto 16px auto', display: 'block', opacity: 0.9 }}
                />
                <p className="nodata-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
                  {t('no_data')}
                </p>
                <p className="nodata-hint" style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
                  {t('no_data_hint')}
                </p>
              </div>
            ) : (
              <div className="dashboard-content-stack">
                {/* ── Accessible Farmer Voice Assistance Banner ── */}
                {topMandi && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
                      color: '#ffffff',
                      borderRadius: '12px',
                      padding: '12px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      boxShadow: '0 4px 14px rgba(20, 83, 45, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.6rem' }}>📢</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                          {lang === 'hi' ? 'आवाज सहायक: मंडी भाव और सलाह सुनें' : 'Voice Assistance: Listen to Market Report'}
                        </div>
                        <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                          {lang === 'hi'
                            ? 'जो किसान भाई पढ़ नहीं सकते, वे एक क्लिक में पूरा भाव और सलाह सुन सकते हैं'
                            : 'Audio readout for users who prefer listening to market intelligence'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleMasterVoiceReadout}
                      style={{
                        background: masterSpeaking ? '#dc2626' : '#f59e0b',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '10px 20px',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {masterSpeaking ? (
                        <>
                          <VolumeOffIcon style={{ width: '18px', height: '18px' }} />
                          <span>{lang === 'hi' ? 'रोकें (Stop)' : 'Stop Audio'}</span>
                        </>
                      ) : (
                        <>
                          <VolumeIcon style={{ width: '18px', height: '18px' }} />
                          <span>{lang === 'hi' ? 'बोलकर सुनाएं (Play)' : 'Read Aloud'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 1. Market Price Overview Spotlight */}
                <MarketOverviewCard
                  topMandi={topMandi}
                  commodity={selectedCommodity}
                  history={activeMandiHistory}
                  lang={lang}
                  t={t}
                />

                {/* 2. Seasonal Market History & Timing ("Is this a good time to sell?") */}
                {topMandi && (
                  <SeasonalTimingSection
                    commodity={selectedCommodity}
                    mandi={topMandi.mandi}
                    currentPrice={topMandi.modal_price}
                    history={activeMandiHistory}
                    lang={lang}
                    t={t}
                  />
                )}

                {/* 3. Side-by-Side Mandi Comparison Matrix */}
                <MandiCompareSection
                  results={filteredResults}
                  commodity={selectedCommodity}
                  selectedMandi={topMandi?.mandi}
                  onSelectMandi={setSelectedMandi}
                  t={t}
                />

                {/* 4. Historical Price Trend Chart (7D & 30D with gaps) */}
                {topMandi && (
                  <PriceHistorySection
                    commodity={selectedCommodity}
                    mandi={topMandi.mandi}
                    t={t}
                  />
                )}

                {/* 5. Transport Cost, Distance & Estimated Net Return Evaluator */}
                <NetReturnCalculator
                  results={rawResults}
                  commodity={selectedCommodity}
                  lang={lang}
                  t={t}
                />

                {/* 6. Target Price Crossing Alerts */}
                {topMandi && (
                  <PriceAlertsSection
                    commodity={selectedCommodity}
                    mandi={topMandi.mandi}
                    currentModalPrice={topMandi.modal_price}
                    lang={lang}
                    t={t}
                  />
                )}

                {/* 7. WhatsApp & SMS Market Digest */}
                {topMandi && (
                  <MandiDigestSection
                    commodity={selectedCommodity}
                    district={selectedDistrict}
                    state={selectedState}
                    topMandi={topMandi}
                    results={rawResults}
                    quantity={50}
                    lang={lang}
                    t={t}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Professional Footer ── */}
      <footer className="dashboard-footer">
        <div className="container footer-container">
          <div className="footer-brand">
            <strong>{t('app_title')}</strong> — {t('tagline')}
          </div>
          <p className="footer-source-note">{t('footer_source')}</p>
          <p className="footer-copyright">
            © {new Date().getFullYear()} MandiSaarthi Platform. Built for Indian Farmers & Market Intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
