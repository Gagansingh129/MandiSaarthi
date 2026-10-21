/**
 * Browser Speech Synthesis utility for MandiSaarthi (Voice Assistance).
 */

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakMarketSummary(text, lang = 'hi', onStart, onEnd, onError) {
  if (!isSpeechSupported()) {
    if (onError) onError('Speech synthesis not supported');
    return false;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // slightly slower for rural clarity
  utterance.pitch = 1.0;

  // Select suitable voice if available
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'hi') {
    utterance.lang = 'hi-IN';
    const hiVoice = voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
    if (hiVoice) utterance.voice = hiVoice;
  } else {
    utterance.lang = 'en-IN';
    const enInVoice = voices.find((v) => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india'));
    if (enInVoice) {
      utterance.voice = enInVoice;
    } else {
      const enVoice = voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    }
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
  return true;
}
