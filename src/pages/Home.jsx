import { Link } from 'react-router-dom';
import { useLang } from '../i18n';

export default function Home() {
  const { t } = useLang();
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="chip chip-proto">{t('badge_proto')}</span>
            <h1>{t('hero_title')}</h1>
            <p className="lead">{t('hero_sub')}</p>
            <div className="row wrap gap">
              <Link to="/sign-to-text" className="btn primary lg">🖐 {t('btn_s2t')}</Link>
              <Link to="/text-to-sign" className="btn secondary lg">🗣 {t('btn_t2s')}</Link>
            </div>
            <p className="muted small">{t('hero_note')}</p>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="flow-card">
              <span className="flow-tag">Sign → Text</span>
              <div className="flow-words"><b>HELLO</b><b>MY</b><b>NAME</b><b>IS</b></div>
              <div className="flow-out">HELLO MY NAME IS</div>
            </div>
            <div className="flow-card offset">
              <span className="flow-tag">Text → Sign</span>
              <div className="flow-out">I NEED WATER</div>
              <div className="flow-words"><b>I</b><span>→</span><b>NEED</b><span>→</span><b>WATER</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="grid-2">
          <Link to="/sign-to-text" className="card link-card">
            <h2 className="h3">{t('card_s2t_title')}</h2>
            <p>{t('card_s2t_desc')}</p>
            <p className="muted small">{t('flow_s2t')}</p>
          </Link>
          <Link to="/text-to-sign" className="card link-card">
            <h2 className="h3">{t('card_t2s_title')}</h2>
            <p>{t('card_t2s_desc')}</p>
            <p className="muted small">{t('flow_t2s')}</p>
          </Link>
        </div>
      </section>

      <section className="container section">
        <h2>{t('how_title')}</h2>
        <p className="muted">{t('how_sub')}</p>
        <ol className="steps">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <li key={n}><strong>{t(`step${n}_t`)}</strong><span>{t(`step${n}_d`)}</span></li>
          ))}
        </ol>
        <p className="disclaimer">{t('disclaimer')}</p>
      </section>
    </>
  );
}
