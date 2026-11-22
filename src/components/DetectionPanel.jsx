import { useState } from 'react';
import { useLang } from '../i18n';

const TONE = { idle: 'neutral', loading: 'neutral', no_hand: 'warn', unknown: 'warn', holding: 'info', added: 'ok' };

export default function DetectionPanel({ state }) {
  const { t } = useLang();
  const [showDebug, setShowDebug] = useState(true);
  const pct = Math.round(state.confidence * 100);
  const debug = state.debugInfo || {};

  return (
    <section className="card" aria-live="polite">
      <div className="row between">
        <h2 className="h3">{t('detected_word')}</h2>
        <span className={`pill ${TONE[state.status] ?? 'neutral'}`}>{t(`st_${state.status}`)}</span>
      </div>
      <div className="detected">{state.word ?? <span className="muted">{t('none_yet')}</span>}</div>
      <div className="hold" aria-hidden="true"><span style={{ width: `${state.progress * 100}%` }} /></div>
      <div className="row between small">
        <span>{t('confidence')}</span>
        <strong>{state.word ? `${pct}%` : '–'}</strong>
      </div>
      <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.word ? pct : 0}>
        <span style={{ width: state.word ? `${pct}%` : 0 }} />
      </div>
      <p className="muted small">{t('conf_note')}</p>

      {/* Live AI Vision Debug Panel */}
      <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
        <div className="row between" style={{ marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>🔍</span> {t('debug_mode')}
          </strong>
          <button
            type="button"
            className="btn ghost sm"
            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            onClick={() => setShowDebug((v) => !v)}
          >
            {showDebug ? '▲ Hide' : '▼ Show'}
          </button>
        </div>

        {showDebug && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, background: '#111', borderRadius: '6px', border: '1px solid #444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {debug.cropPreview ? (
                    <img src={debug.cropPreview} alt="Model Crop" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span className="muted" style={{ fontSize: '0.7rem' }}>No Feed</span>
                  )}
                </div>
                <span className="muted" style={{ fontSize: '0.65rem' }}>{t('debug_crop')}</span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div className="row between">
                  <span className="muted">{t('debug_hands')}:</span>
                  <span className={`chip ${debug.handsCount >= 2 ? 'chip-ok' : 'chip-proto'}`} style={{ padding: '1px 6px', fontSize: '0.75rem' }}>
                    {debug.handsCount === 0 ? '0' : debug.handsCount === 1 ? '1 Hand' : `${debug.handsCount} Hands (ISL 2-Hand)`}
                  </span>
                </div>

                <div>
                  <span className="muted" style={{ display: 'block', marginBottom: '2px' }}>{t('debug_top3')}:</span>
                  {debug.top3 && debug.top3.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {debug.top3.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '3px' }}>
                          <span style={{ fontWeight: idx === 0 ? 'bold' : 'normal', color: idx === 0 ? '#38bdf8' : '#aaa' }}>{item.word}</span>
                          <span style={{ fontFamily: 'monospace' }}>{(item.confidence * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="muted" style={{ fontSize: '0.7rem' }}>–</span>
                  )}
                </div>

                {debug.geometryCandidate && (
                  <div style={{ fontSize: '0.72rem', color: '#34d399' }}>
                    <strong>Geometry Match:</strong> {debug.geometryCandidate} ({Math.round((debug.geometryConfidence || 0) * 100)}%)
                  </div>
                )}
                {debug.rule && (
                  <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>
                    <strong>{t('debug_disambig')}:</strong> {debug.rule}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
