import { SIGN_WORDS } from '../data/signWords.js';
import { SIGN_ANIMATION_MAP } from '../data/signMappings.js';
import { isSignSupported } from '../data/islSignDatabase.js';

// Words that are simply skipped when converting text to signs.
const STOP_WORDS = new Set(['A', 'AN', 'THE', 'TO', 'AM', 'ARE', 'WAS', 'WERE', 'OF']);

const aliasIndex = new Map();
for (const w of SIGN_WORDS) {
  aliasIndex.set(w.id, w.id);
  for (const list of Object.values(w.aliases ?? {})) list.forEach((a) => aliasIndex.set(a.toUpperCase(), w.id));
}
const taLabel = Object.fromEntries(SIGN_WORDS.map((w) => [w.id, w.ta]));

export const getWord = (id) => SIGN_WORDS.find((w) => w.id === id);
export const hasAnimation = (id) => isSignSupported(id) || Boolean(SIGN_ANIMATION_MAP[id]);

export const tokenize = (text) =>
  (text ? String(text).toUpperCase().replace(/[.,!?;:"'()]/g, ' ').split(/\s+/).filter(Boolean) : []);


function walk(tokens, onMatch, onMiss) {
  for (let i = 0; i < tokens.length; i++) {
    const pair = tokens[i + 1] ? `${tokens[i]} ${tokens[i + 1]}` : null;
    if (pair && aliasIndex.has(pair)) { onMatch(aliasIndex.get(pair)); i++; }
    else if (aliasIndex.has(tokens[i])) onMatch(aliasIndex.get(tokens[i]));
    else onMiss(tokens[i]);
  }
}

/** Text (English or Tamil) -> ordered list of {word, status: 'ok' | 'unsupported' | 'skipped', isFingerspelled?: boolean, parentWord?: string}. */
export function textToSigns(text, { fingerspell = false } = {}) {
  const items = [];
  walk(
    tokenize(text),
    (id) => items.push({ word: id, status: hasAnimation(id) ? 'ok' : 'unsupported' }),
    (tok) => {
      if (STOP_WORDS.has(tok)) {
        items.push({ word: tok, status: 'skipped' });
        return;
      }
      if (fingerspell) {
        // Fingerspelling fallback: decompose unknown words (e.g. names) into manual alphabet letters
        const letters = tok.split('').filter((ch) => /^[A-Z]$/.test(ch));
        if (letters.length > 0 && letters.every((ch) => isSignSupported(ch))) {
          letters.forEach((letter) => {
            items.push({
              word: letter,
              status: 'ok',
              isFingerspelled: true,
              parentWord: tok,
            });
          });
          return;
        }
      }
      items.push({ word: tok, status: 'unsupported' });
    },
  );
  return items;
}

/** Turn an English gloss sentence into word-by-word Tamil (unknown words such as names are kept). */
export function glossToTamil(sentence) {
  const out = [];
  walk(
    tokenize(sentence),
    (id) => { if (taLabel[id]) out.push(taLabel[id]); },
    (tok) => out.push(tok),
  );
  return out.join(' ');
}
