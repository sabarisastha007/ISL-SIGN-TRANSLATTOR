import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n';
import CameraView from '../components/CameraView';
import DetectionPanel from '../components/DetectionPanel';
import SentenceBox from '../components/SentenceBox';
import CorrectionSuggestion from '../components/CorrectionSuggestion';
import LanguageSelector from '../components/LanguageSelector';
import { useSignRecognition } from '../hooks/useSignRecognition';
import { suggest } from '../services/correctionService';
import { speak } from '../services/speechService';
import { glossToTamil } from '../services/signMappingService';
import { clearPersonalization, getTopPhrases, recordPhrase } from '../services/personalizationService';
import { SIGN_WORDS } from '../data/signWords';
import { GESTURE_MAP } from '../data/gestureMap';

export default function SignToText() {
  const { t, lang } = useLang();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const editingRef = useRef(false);
  const [sentence, setSentence] = useState('');
  const [editing, setEditing] = useState(false);
  const [demo, setDemo] = useState(false);
  const [note, setNote] = useState('');
  const [frequent, setFrequent] = useState(() => getTopPhrases(5));

  const addWord = useCallback((token) => {
    if (editingRef.current || !token) return;
    const isSingleLetter = typeof token === 'string' && token.length === 1 && /^[A-Z]$/.test(token);
    setSentence((prev) => {
      if (!prev) return token;
      // If fingerspelling single letters, concatenate into the active word
      if (isSingleLetter) {
        return prev.endsWith(' ') ? `${prev}${token}` : `${prev}${token}`;
      }
      // If recognized token is a multi-letter word, append with space
      return prev.endsWith(' ') ? `${prev}${token}` : `${prev} ${token}`;
    });
  }, []);

  const onSpace = useCallback(() => {
    setSentence((s) => (s && !s.endsWith(' ') ? `${s} ` : s));
  }, []);

  const onBackspace = useCallback(() => {
    setSentence((s) => (s ? s.slice(0, -1) : ''));
  }, []);

  const { state, start, stop } = useSignRecognition({ videoRef, canvasRef, onWord: addWord });
  const suggestion = useMemo(() => suggest(sentence), [sentence, frequent]); // eslint-disable-line react-hooks/exhaustive-deps
  const tamil = useMemo(() => (lang === 'ta' ? glossToTamil(sentence) : ''), [sentence, lang]);
  const refreshFrequent = () => setFrequent(getTopPhrases(5));

  useEffect(() => { editingRef.current = editing; }, [editing]);

  const onSpeak = (l) => {
    const text = (sentence || '').trim();
    if (!text) { setNote(t('err_empty_sentence')); return; }
    const res = speak(l === 'ta' ? glossToTamil(text) : text, l);
    setNote(res === 'unsupported' ? t('err_tts_unsupported') : res === 'no_voice' ? t('err_no_voice') : '');
    recordPhrase(text);
    refreshFrequent();
  };
  const onReset = () => {
    const trimmed = (sentence || '').trim();
    if (trimmed && trimmed.split(/\s+/).length >= 2) { recordPhrase(trimmed); refreshFrequent(); }
    setSentence(''); setEditing(false); setNote('');
  };
  const accept = () => { if (suggestion) { setSentence(suggestion.text); setEditing(false); } };
  const onClear = () => { clearPersonalization(); refreshFrequent(); setNote(t('cleared')); };

  return (
    <div className="container section">
      <div className="row between wrap gap page-head">
        <div>
          <h1 className="h2">{t('nav_s2t')}</h1>
          <span className="chip chip-proto">{t('badge_proto')}</span>
        </div>
        <LanguageSelector />
      </div>

      <div className="grid-main">
        <div className="stack">
          <CameraView videoRef={videoRef} canvasRef={canvasRef} running={state.running} loading={state.loading} />
          <div className="row wrap gap">
            <button type="button" className="btn primary" onClick={start} disabled={state.running || state.loading}>
              ▶ {state.loading ? t('starting') : t('start_camera')}
            </button>
            <button type="button" className="btn secondary" onClick={stop} disabled={!state.running && !state.loading}>■ {t('stop_camera')}</button>
            <label className="toggle">
              <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} /> {t('demo_toggle')}
            </label>
          </div>
          {state.error && <div className="alert error" role="alert">{t(state.error)}</div>}
          {state.running && state.backendStatus && (
            <div className={`alert ${state.backendStatus === 'available' ? 'ok' : state.backendStatus === 'fallback' ? 'warn' : ''}`} role="status">
              {state.backendStatus === 'available' && `🟢 ${t('backend_available')}`}
              {state.backendStatus === 'fallback' && `🟡 ${t('backend_fallback')}`}
              {state.backendStatus === 'checking' && `⏳ ${t('backend_checking')}`}
            </div>
          )}

          {demo && (
            <section className="card demo">
              <h2 className="h3">{t('demo_mode')}</h2>
              <p className="muted small">{t('demo_note')}</p>
              <div className="row wrap gap">
                {SIGN_WORDS.map((w) => (
                  <button type="button" key={w.id} className="btn ghost sm" onClick={() => addWord(w.id)}>{w.id}</button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="stack">
          <DetectionPanel state={state} />
          <SentenceBox
            sentence={sentence} tamil={tamil} editing={editing}
            onChange={setSentence} onEdit={() => setEditing(true)} onSave={() => setEditing(false)}
            onReset={onReset} onSpeak={onSpeak} onSpace={onSpace} onBackspace={onBackspace}
          />
          {note && <div className="alert" role="status">{note}</div>}
          <CorrectionSuggestion suggestion={suggestion} onAccept={accept} onEdit={() => setEditing(true)} />
        </div>
      </div>

      <div className="grid-2 section-gap">
        <section className="card">
          <h2 className="h3">{t('words_title')}</h2>
          <p className="muted small">{t('pattern_hint')}</p>
          <ul className="words">
            {SIGN_WORDS.map((w) => (
              <li key={w.id}>
                <span>{w.id}</span>
                <span className="dots" aria-hidden="true">{(GESTURE_MAP[w.id] ?? []).map((f) => (f ? '●' : '○')).join('')}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2 className="h3">{t('personal_title')}</h2>
          <p className="muted small">{t('personal_note')}</p>
          <h3 className="h4">{t('frequent')}</h3>
          {frequent.length ? (
            <ul className="plain">
              {frequent.map((f) => (
                <li key={f.phrase} className="row between">
                  <button type="button" className="link" onClick={() => setSentence(f.phrase)}>{f.phrase}</button>
                  <span className="muted small">{f.count}{t('times')}</span>
                </li>
              ))}
            </ul>
          ) : <p className="muted small">{t('no_frequent')}</p>}
          <button type="button" className="btn ghost" onClick={onClear}>🗑 {t('clear_personal')}</button>
        </section>
      </div>
    </div>
  );
}
