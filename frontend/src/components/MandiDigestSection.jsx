import React, { useState } from 'react';
import { formatPrice, formatDate } from '../utils/formatters';
import { speakMarketSummary } from '../utils/speech';
import { VolumeIcon, CheckIcon } from './Icons';

export default function MandiDigestSection({
  commodity,
  district,
  state,
  topMandi,
  results = [],
  quantity = 50,
  lang = 'en',
  t,
}) {
  const [copied, setCopied] = useState(false);

  if (!topMandi || !commodity || !district) return null;

  const validMandis = results.filter((r) => !r.no_rate_reported && r.modal_price !== null);
  const topRate = topMandi.modal_price || 0;
  const grossTotal = quantity * topRate;

  // Build bilingual text digest
  const todayStr = formatDate(topMandi.reported_date);

  const digestHi = `🌾 *मंडी सारथी दैनिक भाव रिपोर्ट* (${todayStr})
━━━━━━━━━━━━━━━━━━
📍 *फसल:* ${commodity}
📍 *जिला:* ${district}, ${state}

🏆 *सर्वोत्तम भाव मंडी:*
• मंडी: *${topMandi.mandi}*
• मोडल भाव: *₹${Math.round(topRate).toLocaleString('en-IN')}/क्विंटल*
• न्यूनतम - अधिकतम: ₹${Math.round(topMandi.min_price || 0)} - ₹${Math.round(topMandi.max_price || 0)}
• स्रोत: आधिकारिक Agmarknet रिकॉर्ड

🚚 *अनुमानित फसल मूल्य (${quantity} क्विंटल):*
• सकल मूल्य: *₹${Math.round(grossTotal).toLocaleString('en-IN')}*

📊 *अन्य उपलब्ध मंडियां:*
${validMandis
  .slice(0, 3)
  .map((m, idx) => `${idx + 1}. ${m.mandi}: ₹${Math.round(m.modal_price)}/क्विंटल`)
  .join('\n')}

💡 *सही मंडी, बेहतर फैसला:*
अधिक भाव देखकर दूर की मंडी जाने से पहले ट्रांसपोर्ट खर्च अवश्य जोड़ें! 60 किमी दूर का ₹100 अधिक भाव ट्रांसपोर्ट में घट सकता है।

📲 मंडी सारथी: https://mandisaarthi.in`;

  const digestEn = `🌾 *MandiSaarthi Daily Market Digest* (${todayStr})
━━━━━━━━━━━━━━━━━━
📍 *Crop:* ${commodity}
📍 *District:* ${district}, ${state}

🏆 *Top Selling Opportunity:*
• Mandi: *${topMandi.mandi}*
• Modal Price: *₹${Math.round(topRate).toLocaleString('en-IN')}/Quintal*
• Range: ₹${Math.round(topMandi.min_price || 0)} - ₹${Math.round(topMandi.max_price || 0)}
• Source: Official Agmarknet Record

🚚 *Estimated Harvest Value (${quantity} Qtl):*
• Gross Value: *₹${Math.round(grossTotal).toLocaleString('en-IN')}*

📊 *Mandi Comparison:*
${validMandis
  .slice(0, 3)
  .map((m, idx) => `${idx + 1}. ${m.mandi}: ₹${Math.round(m.modal_price)}/qtl`)
  .join('\n')}

💡 *Smart Farmer Advice:*
A higher price 60 km away can turn into a worse deal after hauling costs. Always check net returns!

📲 MandiSaarthi Platform: https://mandisaarthi.in`;

  const textDigest = lang === 'hi' ? digestHi : digestEn;

  function handleWhatsAppShare() {
    const encoded = encodeURIComponent(textDigest);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  }

  function handleSmsShare() {
    const encoded = encodeURIComponent(textDigest);
    window.location.href = `sms:?body=${encoded}`;
  }

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textDigest).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }

  function handleListenDigest() {
    const speechText =
      lang === 'hi'
        ? `मंडी सारथी रिपोर्ट: ${district} में ${commodity} के लिए सबसे अच्छी मंडी ${topMandi.mandi} है। यहां आज का मोडल भाव ₹${Math.round(topRate)} प्रति क्विंटल है। पचास क्विंटल फसल का अनुमानित मूल्य ₹${Math.round(grossTotal)} है। दूर जाने से पहले ट्रांसपोर्ट खर्च अवश्य जांचें।`
        : `MandiSaarthi report: In ${district}, the best selling opportunity for ${commodity} is ${topMandi.mandi} with a modal price of ₹${Math.round(topRate)} per quintal. For ${quantity} quintals, estimated harvest value is ₹${Math.round(grossTotal)}. Always calculate transport cost before travelling far.`;
    speakMarketSummary(speechText, lang);
  }

  return (
    <section className="mandi-digest-card card" style={{ marginTop: '20px', borderLeft: '4px solid #25d366' }}>
      <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>📲</span>
            <span>{lang === 'hi' ? 'व्हाट्सएप और एसएमएस मंडी रिपोर्ट' : 'WhatsApp & SMS Market Digest'}</span>
          </h2>
          <p className="section-subtitle" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {lang === 'hi'
              ? 'किसान भाइयों या व्यापारियों के साथ एक क्लिक में आज का ताजा मंडी भाव साझा करें'
              : 'Share verified daily mandi rates and transport estimates with farmers & traders'}
          </p>
        </div>

        {/* Audio listen button */}
        <button
          type="button"
          onClick={handleListenDigest}
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
          title="Listen Digest"
        >
          <VolumeIcon style={{ width: '16px', height: '16px' }} />
          <span>{lang === 'hi' ? 'रिपोर्ट सुनें' : 'Listen Report'}</span>
        </button>
      </div>

      {/* Preview Box */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '14px 16px',
          margin: '14px 0',
          fontFamily: 'monospace, sans-serif',
          fontSize: '0.86rem',
          whiteSpace: 'pre-line',
          color: '#1e293b',
          maxHeight: '220px',
          overflowY: 'auto',
          lineHeight: '1.5',
        }}
      >
        {textDigest}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleWhatsAppShare}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#25d366',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(37, 211, 102, 0.35)',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>💬</span>
          <span>{lang === 'hi' ? 'व्हाट्सएप पर भेजें' : 'Share on WhatsApp'}</span>
        </button>

        <button
          type="button"
          onClick={handleSmsShare}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>✉️</span>
          <span>{lang === 'hi' ? 'एसएमएस भेजें' : 'Send via SMS'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: copied ? '#ecfdf5' : '#f1f5f9',
            color: copied ? '#15803d' : '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {copied ? <CheckIcon style={{ width: '16px', height: '16px', color: '#16a34a' }} /> : null}
          <span>{copied ? (lang === 'hi' ? 'कॉपी हो गया!' : 'Copied!') : (lang === 'hi' ? 'कॉपी करें' : 'Copy Text')}</span>
        </button>
      </div>
    </section>
  );
}
