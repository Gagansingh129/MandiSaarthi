import React from 'react';
import { SparklesIcon, ScaleIcon, TruckIcon, ShieldCheckIcon } from './Icons';

export default function HeroSection({ t }) {
  return (
    <section className="hero-banner">
      <div className="hero-content">
        <div className="hero-badge">
          <SparklesIcon className="icon-sparkle" />
          <span>{t('hero_badge')}</span>
        </div>
        <h1 className="hero-heading">{t('hero_title')}</h1>
        <p className="hero-subheading">{t('hero_subtitle')}</p>

        <div className="hero-pills">
          <div className="hero-feature-pill">
            <ShieldCheckIcon className="pill-icon" />
            <span>Official Agmarknet Rates</span>
          </div>
          <div className="hero-feature-pill">
            <ScaleIcon className="pill-icon" />
            <span>Inter-Mandi Comparison</span>
          </div>
          <div className="hero-feature-pill">
            <TruckIcon className="pill-icon" />
            <span>Transport Return Estimator</span>
          </div>
        </div>

        {/* Agricultural Landscape Visual Banner */}
        <div className="hero-image-wrapper" style={{ marginTop: '16px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.12)', border: '1px solid rgba(22, 101, 52, 0.15)' }}>
          <img
            src="/images/hero-farm-landscape.svg"
            alt="Lush Indian Farmland and Harvest"
            style={{ width: '100%', height: 'auto', maxHeight: '160px', display: 'block', objectFit: 'cover' }}
          />
        </div>
      </div>
    </section>
  );
}
