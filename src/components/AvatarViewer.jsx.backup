import { useEffect, useRef, useState } from 'react';
import { createAvatar } from '../avatar/createAvatar';
import { getSignData } from '../data/islSignDatabase';
import { useLang } from '../i18n';

export default function AvatarViewer({
  word,
  cue,
  speed = 1,
  character = 'male',
  paused = false,
  onFullscreenToggle,
  isFullscreen = false,
}) {
  const { t } = useLang();
  const box = useRef(null);
  const containerRef = useRef(null);
  const avatar = useRef(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sign metadata
  const signData = word ? getSignData(word) : null;

  // Initialize avatar engine
  useEffect(() => {
    if (!box.current) return;
    try {
      avatar.current = createAvatar(box.current, character);
      setLoading(false);
    } catch (e) {
      console.error('[isl] WebGL avatar init failed', e);
      setFailed(true);
      setLoading(false);
    }
    return () => {
      avatar.current?.dispose();
      avatar.current = null;
    };
  }, []); // Run once on mount

  // Switch character dynamically without resetting playback or component
  useEffect(() => {
    if (avatar.current) {
      avatar.current.setCharacter(character);
    }
  }, [character]);

  // Speed control
  useEffect(() => {
    avatar.current?.setSpeed(speed);
  }, [speed]);

  // Pause / Resume control
  useEffect(() => {
    if (!avatar.current) return;
    if (paused) {
      avatar.current.pause();
    } else {
      avatar.current.resume();
    }
  }, [paused]);

  // Play word or rest on word/cue changes
  useEffect(() => {
    if (!avatar.current) return;
    if (word) {
      avatar.current.play(word);
    } else {
      avatar.current.rest();
    }
  }, [word, cue]);

  // Native fullscreen toggle helper
  const handleToggleFullscreen = () => {
    if (onFullscreenToggle) {
      onFullscreenToggle();
      return;
    }
    const elem = containerRef.current;
    if (!elem) return;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.().catch((err) => console.warn('Fullscreen request failed', err));
    } else {
      document.exitFullscreen?.().catch((err) => console.warn('Exit fullscreen failed', err));
    }
  };

  return (
    <div ref={containerRef} className={`avatar ${isFullscreen ? 'is-fullscreen' : ''}`}>
      <div ref={box} className="avatar-canvas" role="img" aria-label="Semi-realistic 3D human avatar performing Indian Sign Language" />

      {loading && (
        <div className="avatar-loading" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>{t('loading_avatar') || 'Loading Semi-Realistic 3D Avatar…'}</span>
        </div>
      )}

      {failed && (
        <div className="avatar-fail">
          <p>⚠️ 3D WebGL graphics are not available in this browser or device.</p>
        </div>
      )}

      {/* Top overlay: Character Identity & Fullscreen Toggle */}
      <div className="avatar-top-bar">
        <span className="character-badge">
          {character === 'female' ? '👩 Priya (Female)' : '👨 Arjun (Male)'}
        </span>
        <button
          type="button"
          className="btn-fullscreen"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? t('exit_fullscreen') || 'Exit Fullscreen' : t('fullscreen') || 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? '⤢' : '⛶'}
        </button>
      </div>

      {/* Bottom overlay: Word & Sign Verification info */}
      <div className="avatar-label">
        <div className="row between gap">
          <div>
            <span className="muted small">{t('now_signing')}</span>
            <strong className="avatar-current-word">{word ?? '–'}</strong>
          </div>
          {signData && (
            <div className="avatar-sign-tags">
              <span className={`pill small ${signData.verificationStatus === 'verified' ? 'ok' : 'info'}`}>
                {signData.verificationStatus === 'verified' ? '✔ ISLRTC Verified' : 'Provisional'}
              </span>
              <span className="pill small ghost-pill">{signData.category}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
