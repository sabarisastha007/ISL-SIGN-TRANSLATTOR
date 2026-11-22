import { useLang } from '../i18n';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="container">
        <p className="disclaimer">{t('disclaimer')}</p>
        <p className="muted small">{t('footer')}</p>
      </div>
    </footer>
  );
}
