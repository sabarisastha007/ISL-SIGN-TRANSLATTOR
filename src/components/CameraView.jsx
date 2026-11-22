import { useLang } from '../i18n';

export default function CameraView({ videoRef, canvasRef, running, loading }) {
  const { t } = useLang();
  return (
    <div className="camera">
      {/* video + landmark overlay are mirrored together so movement feels natural */}
      <div className={`camera-stage ${running ? 'live' : ''}`}>
        <video ref={videoRef} playsInline muted aria-label="Webcam preview" />
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
      {!running && (
        <div className="camera-empty">
          <span className="camera-icon" aria-hidden="true">📷</span>
          <strong>{loading ? t('loading_model') : t('camera_off')}</strong>
          {!loading && <span className="muted">{t('camera_off_hint')}</span>}
        </div>
      )}
      <span className="chip chip-proto">{t('badge_proto')}</span>
    </div>
  );
}
