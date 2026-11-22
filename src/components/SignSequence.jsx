import { useLang } from '../i18n';

export default function SignSequence({ items, activeWordIndex, onSelect }) {
  const { t } = useLang();
  if (!items.length) return <p className="muted">{t('seq_empty')}</p>;
  let playableIdx = -1;
  return (
    <ol className="seq">
      {items.map((it, i) => {
        const ok = it.status === 'ok';
        if (ok) playableIdx += 1;
        const idx = playableIdx;
        return (
          <li key={`${it.word}-${i}`}>
            {ok ? (
              <button
                type="button"
                className={`seq-chip ${idx === activeWordIndex ? 'active' : ''} ${it.isFingerspelled ? 'fingerspelled' : ''}`}
                onClick={() => onSelect(idx)}
                title={it.isFingerspelled ? `${t('fingerspelled')}: ${it.parentWord ?? it.word}` : undefined}
              >
                {it.word}
                {it.isFingerspelled && <span className="fs-tag" aria-hidden="true"> 🔤</span>}
              </button>
            ) : (
              <span className="seq-chip off" title={t(it.status)}>{it.word}<small>{t(it.status)}</small></span>
            )}
            {i < items.length - 1 && <span className="seq-arrow" aria-hidden="true">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
