// Privacy-friendly personalization: phrase frequencies live ONLY in this browser's localStorage.
const KEY = 'isl_phrase_freq_v1';

const load = () => { try { const data = JSON.parse(localStorage.getItem(KEY)); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; } catch { return {}; } };
const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage unavailable */ } };
const norm = (s) => (s ? String(s).trim().replace(/\s+/g, ' ').toUpperCase() : '');

export function recordPhrase(sentence) {
  const p = norm(sentence);
  if (!p) return;
  const d = load();
  d[p] = (d[p] ?? 0) + 1;
  save(d);
}

export function getTopPhrases(n = 5) {
  return Object.entries(load()).sort((a, b) => b[1] - a[1]).slice(0, n).map(([phrase, count]) => ({ phrase, count }));
}

/** Frequently used phrases that start with (and are longer than) the current text. */
export function suggestCompletions(prefix) {
  const p = norm(prefix);
  if (!p) return [];
  return Object.entries(load())
    .filter(([phrase]) => phrase.startsWith(p + ' '))
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase);
}

export const clearPersonalization = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
