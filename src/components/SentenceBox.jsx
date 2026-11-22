import { useLang } from '../i18n';
import VoiceButton from './VoiceButton';

export default function SentenceBox({ sentence = '', tamil, editing, onChange, onEdit, onSave, onReset, onSpeak, onSpace, onBackspace }) {
  const { t, lang } = useLang();
  const text = typeof sentence === 'string' ? sentence : (sentence ? String(sentence) : '');
  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  return (
    <section className="card">
      <div className="row between">
        <h2 className="h3">{t('sentence')}</h2>
        <span className="chip">{wordCount}</span>
      </div>
      {editing ? (
        <textarea
          className="field sentence-edit"
          value={text}
          onChange={(e) => onChange?.(e.target.value.toUpperCase())}
          placeholder={t('sentence_ph')}
          rows={3}
          autoFocus
          aria-label={t('sentence')}
        />
      ) : (
        <div className="sentence" aria-live="polite">
          {text || <span className="muted">{t('sentence_empty')}</span>}
        </div>
      )}
      {lang === 'ta' && tamil && !editing && (
        <p className="tamil-line">
          <span className="muted small">{t('tamil_line')}</span>
          <br />
          {tamil}
        </p>
      )}
      <div className="row wrap gap">
        <VoiceButton icon="🔊" label={t('speak_en')} variant="primary" onClick={() => onSpeak?.('en')} />
        <VoiceButton icon="🔊" label={t('speak_ta')} onClick={() => onSpeak?.('ta')} />
        {onSpace && <VoiceButton icon="␣" label={t('space') || 'Space'} variant="ghost" onClick={onSpace} />}
        {onBackspace && <VoiceButton icon="⌫" label={t('backspace') || 'Backspace'} variant="ghost" onClick={onBackspace} />}
        {editing
          ? <VoiceButton icon="✔" label={t('save')} onClick={onSave} />
          : <VoiceButton icon="✎" label={t('edit')} onClick={onEdit} />}
        <VoiceButton icon="↺" label={t('reset')} variant="ghost" onClick={onReset} />
      </div>
    </section>
  );
}

