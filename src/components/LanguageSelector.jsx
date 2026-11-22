import { useLang } from '../i18n';

export default function LanguageSelector() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="seg" role="group" aria-label={t('lang_label')}>
      <button type="button" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
      <button type="button" className={lang === 'ta' ? 'on' : ''} aria-pressed={lang === 'ta'} onClick={() => setLang('ta')}>தமிழ்</button>
    </div>
  );
}
