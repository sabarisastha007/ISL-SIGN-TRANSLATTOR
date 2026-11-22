import { useLang } from '../i18n';

const TECH = ['React + Vite', 'MediaPipe Hands (HandLandmarker)', 'Three.js', 'Web Speech API', 'localStorage'];

export default function About() {
  const { t } = useLang();
  return (
    <div className="container section narrow">
      <h1 className="h2">{t('how_title')}</h1>
      <p className="lead">{t('how_sub')}</p>
      <ol className="steps">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <li key={n}><strong>{t(`step${n}_t`)}</strong><span>{t(`step${n}_d`)}</span></li>
        ))}
      </ol>
      <h2 className="h3">{t('limits_title')}</h2>
      <ul className="plain">{[1, 2, 3, 4].map((n) => <li key={n}>{t(`limit${n}`)}</li>)}</ul>
      <h2 className="h3">{t('tech_title')}</h2>
      <div className="row wrap gap">{TECH.map((x) => <span className="chip" key={x}>{x}</span>)}</div>
      <p className="disclaimer">{t('disclaimer')}</p>
    </div>
  );
}
