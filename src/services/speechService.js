const LOCALE = { en: 'en-IN', ta: 'ta-IN' };

export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Speak text. Returns 'ok' | 'unsupported' | 'no_voice' (still attempts to speak in the last case). */
export function speak(text, lang = 'en') {
  if (!ttsSupported()) return 'unsupported';
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LOCALE[lang] ?? 'en-IN';
  const voices = synth.getVoices();
  const voice = voices.find((v) => v.lang === u.lang) ?? voices.find((v) => v.lang.startsWith(lang));
  if (voice) u.voice = voice;
  synth.speak(u);
  return voices.length && !voice ? 'no_voice' : 'ok';
}

export const stopSpeaking = () => ttsSupported() && window.speechSynthesis.cancel();

const getRecognition = () => (typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition);
export const sttSupported = () => Boolean(getRecognition());

/** Start one-shot voice input. onError receives 'unsupported' | 'denied' | 'no_speech' | 'other'. */
export function startListening({ lang = 'en', onResult, onError, onEnd }) {
  const SR = getRecognition();
  if (!SR) { onError?.('unsupported'); onEnd?.(); return null; }
  const rec = new SR();
  rec.lang = LOCALE[lang] ?? 'en-IN';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => onResult?.(e.results[0][0].transcript);
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') onError?.('denied');
    else if (e.error === 'no-speech') onError?.('no_speech');
    else if (e.error !== 'aborted') onError?.('other');
  };
  rec.onend = () => onEnd?.();
  try { rec.start(); } catch { onError?.('other'); onEnd?.(); return null; }
  return rec;
}
