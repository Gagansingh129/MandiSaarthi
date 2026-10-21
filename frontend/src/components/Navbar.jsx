import React, { useState } from 'react';
import { WheatIcon, ShieldCheckIcon } from './Icons';
import { fetchDataStatus, triggerRefresh } from '../api/mandiApi';

export default function Navbar({ lang, onToggleLang, t, healthData }) {
  const isLive = healthData?.data_source === 'live_api';
  const [showModal, setShowModal] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  async function openStatusModal() {
    setShowModal(true);
    setLoadingStatus(true);
    setSyncMessage('');
    try {
      const data = await fetchDataStatus();
      setStatusData(data);
    } catch {
      setStatusData(null);
    } finally {
      setLoadingStatus(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await triggerRefresh();
      setSyncMessage(res.message || 'Sync complete.');
      // Refresh status data
      const data = await fetchDataStatus();
      setStatusData(data);
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <header className="navbar-root">
      <div className="container navbar-container">
        {/* Brand Group */}
        <div className="navbar-brand">
          <div className="brand-logo-icon">
            <WheatIcon className="icon-wheat-logo" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <span className="brand-name">{t('app_title')}</span>
              <span className="brand-version-badge">v1.0 MVP</span>
            </div>
            <p className="brand-tagline">{t('tagline')}</p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="navbar-actions">
          {/* Status pill (clickable for data provenance & sync) */}
          <button
            type="button"
            className="system-status-pill"
            onClick={openStatusModal}
            title="Click to view Agmarknet data integrity & provenance"
            style={{ cursor: 'pointer' }}
          >
            <span className={`status-dot ${isLive ? 'dot-live' : 'dot-snapshot'}`} />
            <ShieldCheckIcon className="icon-shield-status" />
            <span className="status-label">
              {isLive ? t('system_status_live') : t('system_status_csv')}
            </span>
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            className="lang-pill-btn"
            onClick={onToggleLang}
            aria-label="Switch Language"
          >
            <span className="lang-icon">🌐</span>
            <span className="lang-text">{t('lang_toggle')}</span>
          </button>
        </div>
      </div>

      {/* Data Provenance & Diagnostics Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#1e293b',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 id="modal-title" style={{ margin: 0, fontSize: '1.2rem', color: '#14532d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheckIcon style={{ width: '22px', height: '22px', color: '#16a34a' }} />
                Data Provenance & Agmarknet Sync
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {loadingStatus ? (
              <p style={{ color: '#64748b' }}>Loading data diagnostics...</p>
            ) : statusData ? (
              <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <div><strong>Official Source:</strong> Agmarknet / data.gov.in</div>
                  <div><strong>Resource ID:</strong> <code style={{ fontSize: '0.8rem' }}>{statusData.resource_id}</code></div>
                  <div><strong>Active Data Mode:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#16a34a' }}>{statusData.data_mode}</span></div>
                  <div><strong>API Key Status:</strong> {statusData.api_key_diagnostic}</div>
                  <div><strong>Last Refreshed:</strong> {statusData.last_synced_at || 'Cleaned Verified Snapshot'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#047857' }}>Total Records</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065f46' }}>{statusData.total_records_in_store}</div>
                  </div>
                  <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#047857' }}>Reporting Mandis</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065f46' }}>{statusData.unique_mandis}</div>
                  </div>
                </div>

                {syncMessage && (
                  <div style={{ padding: '8px 12px', borderRadius: '6px', background: syncMessage.includes('failed') ? '#fef2f2' : '#f0fdf4', color: syncMessage.includes('failed') ? '#991b1b' : '#166534', marginBottom: '12px', fontSize: '0.85rem' }}>
                    {syncMessage}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: syncing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {syncing ? 'Syncing...' : 'Fetch Live Agmarknet Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      background: '#e2e8f0',
                      color: '#334155',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: '#ef4444' }}>Could not load data status.</p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
