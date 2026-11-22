import { useLang } from '../i18n';

export default function CorrectionSuggestion({ suggestion, onAccept, onEdit }) {
  const { t } = useLang();
  return (
    <section className="card">
      <h2 className="h3">{t('suggestion')}</h2>
      {suggestion ? (
        <>
          <p className="suggest-text">{suggestion.text}</p>
          <p className="muted small">{t(`reason_${suggestion.reason}`)}</p>
          <div className="row wrap gap">
            <button type="button" className="btn primary" onClick={onAccept}>✔ {t('accept')}</button>
            <button type="button" className="btn secondary" onClick={onEdit}>✎ {t('edit')}</button>
          </div>
        </>
      ) : (
        <p className="muted">{t('no_suggestion')}</p>
      )}
    </section>
  );
}
