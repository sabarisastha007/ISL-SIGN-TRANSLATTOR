import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n';
import AvatarViewer from '../components/AvatarViewer';
import SignSequence from '../components/SignSequence';
import LanguageSelector from '../components/LanguageSelector';
import VoiceButton from '../components/VoiceButton';
import { textToSigns } from '../services/signMappingService';
import { startListening, stopSpeaking } from '../services/speechService';
import { getSignData } from '../data/islSignDatabase';

const STEP_MS = 1850; // avatar time per word at 1x
const MIC_ERR = {
  unsupported: 'err_speech_unsupported',
  denied: 'err_mic_denied',
  no_speech: 'err_no_speech',
  other: 'err_speech_other',
};

export default function TextToSign() {
  const { t, lang } = useLang();
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cue, setCue] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [character, setCharacter] = useState('male'); // 'male' | 'female'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const recRef = useRef(null);

  const playable = useMemo(() => items.filter((i) => i.status === 'ok'), [items]);
  const unsupported = useMemo(() => items.filter((i) => i.status === 'unsupported').map((i) => i.word), [items]);
  const currentWord = playable.length ? playable[Math.max(0, Math.min(idx, playable.length - 1))]?.word : null;
  const currentSignData = currentWord ? getSignData(currentWord) : null;

  // Step through sequence while playing
  useEffect(() => {
    if (!playing) return undefined;
    const duration = (currentSignData?.duration || STEP_MS) / speed;
    const id = setTimeout(() => {
      if (idx + 1 < playable.length) {
        setIdx((prev) => prev + 1);
        setCue((c) => c + 1);
      } else {
        setPlaying(false);
      }
    }, duration);
    return () => clearTimeout(id);
  }, [playing, idx, playable.length, speed, currentSignData]);

  // Cleanup microphone on unmount
  useEffect(() => () => {
    recRef.current?.abort?.();
    stopSpeaking();
  }, []);

  const translate = (input = text) => {
    setError('');
    const str = typeof input === 'string' ? input : (input ? String(input) : '');
    if (!str.trim()) {
      setError(t('err_empty'));
      return;
    }
    const result = textToSigns(str, { fingerspell: true });
    if (!result.some((r) => r.status === 'ok')) {
      setItems(result);
      setError(t('err_none_supported'));
      setPlaying(false);
      return;
    }
    setItems(result);
    setIdx(0);
    setCue((c) => c + 1);
    setPlaying(true);
  };

  const onMic = () => {
    if (listening) {
      recRef.current?.stop?.();
      return;
    }
    setError('');
    setListening(true);
    recRef.current = startListening({
      lang,
      onResult: (transcript) => {
        setText(transcript);
        translate(transcript);
      },
      onError: (code) => setError(t(MIC_ERR[code] ?? 'err_speech_other')),
      onEnd: () => setListening(false),
    });
  };

  const onReset = () => {
    setText('');
    setItems([]);
    setIdx(0);
    setPlaying(false);
    setError('');
  };

  const select = (i) => {
    setIdx(i);
    setCue((c) => c + 1);
    setPlaying(false);
  };

  const replayCurrent = () => {
    if (!playable.length) return;
    setCue((c) => c + 1);
  };

  const replayAll = () => {
    if (!playable.length) return;
    setIdx(0);
    setCue((c) => c + 1);
    setPlaying(true);
  };

  const togglePlay = () => {
    if (!playable.length) return;
    if (playing) {
      setPlaying(false);
    } else if (idx >= playable.length - 1) {
      replayAll();
    } else {
      setCue((c) => c + 1);
      setPlaying(true);
    }
  };

  const progressPercent = playable.length > 0 ? Math.round(((idx + 1) / playable.length) * 100) : 0;

  return (
    <div className="container section">
      <div className="row between wrap gap page-head">
        <div>
          <h1 className="h2">{t('nav_t2s')}</h1>
          <span className="chip chip-proto">ISLRTC 3D Cartoon Avatars</span>
        </div>
        <LanguageSelector />
      </div>

      <div className="grid-main">
        {/* Left Column: Input, Controls & Sentence Sequence */}
        <div className="stack">
          {/* Avatar Character Switcher */}
          <section className="card avatar-switcher-card">
            <div className="row between wrap gap">
              <div>
                <span className="h3 block" style={{ marginBottom: '.2rem' }}>{t('avatar_character')}</span>
                <span className="muted small">Switch character without losing sentence progress</span>
              </div>
              <div className="seg avatar-char-seg" role="group" aria-label={t('avatar_character')}>
                <button
                  type="button"
                  className={character === 'male' ? 'on' : ''}
                  onClick={() => setCharacter('male')}
                  aria-pressed={character === 'male'}
                >
                  {t('char_male')}
                </button>
                <button
                  type="button"
                  className={character === 'female' ? 'on' : ''}
                  onClick={() => setCharacter('female')}
                  aria-pressed={character === 'female'}
                >
                  {t('char_female')}
                </button>
              </div>
            </div>
          </section>

          {/* Text & Speech Input */}
          <section className="card">
            <label htmlFor="t2s-input" className="h3 block">{t('input_label')}</label>
            <textarea
              id="t2s-input"
              className="field"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('input_ph')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  translate();
                }
              }}
            />
            <div className="row wrap gap">
              <VoiceButton icon="🎤" label={listening ? t('listening') : t('mic')} active={listening} onClick={onMic} />
              <button type="button" className="btn primary" onClick={() => translate()}>{t('translate')}</button>
              <button type="button" className="btn ghost" onClick={onReset}>↺ {t('reset')}</button>
            </div>
            {error && <div className="alert error" role="alert">{error}</div>}
            {unsupported.length > 0 && !error && (
              <div className="alert" role="status">
                {t('unsupported_words')} {unsupported.join(', ')}
              </div>
            )}
          </section>

          {/* Sign Sequence Display & Progress Bar */}
          <section className="card">
            <div className="row between wrap gap" style={{ marginBottom: '.6rem' }}>
              <h2 className="h3">{t('sign_seq')}</h2>
              {playable.length > 0 && (
                <span className="muted small">
                  {t('sentence_progress')}: {idx + 1} / {playable.length} ({progressPercent}%)
                </span>
              )}
            </div>

            {playable.length > 0 && (
              <div className="meter progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${progressPercent}%` }} />
              </div>
            )}

            <SignSequence items={items} activeWordIndex={playing || playable.length ? idx : -1} onSelect={select} />
          </section>

          {/* Sign Linguistic Details Card */}
          {currentSignData && (
            <section className="card sign-info-card">
              <div className="row between wrap gap">
                <h3 className="h3" style={{ margin: 0 }}>
                  🤟 {currentSignData.word}
                </h3>
                <span className={`pill small ${currentSignData.verificationStatus === 'verified' ? 'ok' : 'info'}`}>
                  {currentSignData.verificationStatus === 'verified' ? t('verified_isl') : t('provisional_isl')}
                </span>
              </div>
              <p className="small muted" style={{ marginTop: '.4rem', marginBottom: '.6rem' }}>
                {currentSignData.description}
              </p>
              <div className="sign-meta-grid">
                <div>
                  <strong className="small">{t('category_label') || 'Category'}:</strong>
                  <span className="small muted block">{currentSignData.category}</span>
                </div>
                <div>
                  <strong className="small">{t('hand_config')}:</strong>
                  <span className="small muted block">{currentSignData.handConfiguration?.dominant}</span>
                </div>
                <div>
                  <strong className="small">{t('motion')}:</strong>
                  <span className="small muted block">{currentSignData.movement}</span>
                </div>
                <div>
                  <strong className="small">{t('source_label')}:</strong>
                  <span className="small muted block">{currentSignData.source}</span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: 3D Cartoon Avatar Viewer & Playback Controls */}
        <section className="card avatar-card">
          <AvatarViewer
            word={currentWord}
            cue={cue}
            speed={speed}
            character={character}
            paused={!playing && playable.length > 0}
            onFullscreenToggle={() => setIsFullscreen((prev) => !prev)}
            isFullscreen={isFullscreen}
          />

          {/* Playback & Animation Control Bar */}
          <div className="row wrap gap between avatar-controls-bar">
            <div className="row wrap gap">
              <button
                type="button"
                className="btn primary"
                onClick={togglePlay}
                disabled={!playable.length}
                title={playing ? t('pause') : t('play')}
              >
                {playing ? `⏸ ${t('pause')}` : `▶ ${t('play')}`}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={replayCurrent}
                disabled={!playable.length}
                title={t('replay_current')}
              >
                {t('replay_current')}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={replayAll}
                disabled={!playable.length}
                title={t('replay_all')}
              >
                {t('replay_all')}
              </button>
            </div>

            <div className="row wrap gap align-center">
              <label className="speed">
                {t('speed')}
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={0.5}>0.5×</option>
                  <option value={0.75}>0.75×</option>
                  <option value={1}>1.0×</option>
                  <option value={1.25}>1.25×</option>
                  <option value={1.5}>1.5×</option>
                </select>
              </label>
            </div>
          </div>

          <p className="muted small">{t('avatar_note')}</p>
        </section>
      </div>
    </div>
  );
}
