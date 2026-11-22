// Lightweight, fully local correction. suggest() is the single entry point, so a real LLM/API
// corrector can replace it later (see README).
import { SIGN_WORDS } from '../data/signWords';
import { suggestCompletions } from './personalizationService';
import { tokenize } from './signMappingService';

const EXTRA = ['AM', 'ARE', 'WANT', 'GO', 'TO', 'THE', 'A', 'WHERE', 'WHAT', 'HOW', 'GOOD', 'MORNING', 'DOCTOR',
  'HOSPITAL', 'TODAY', 'NOW', 'WE', 'HE', 'SHE', 'THIS', 'THAT', 'AND', 'CAN', 'WITH', 'FOR', 'HAVE', 'PAIN', 'HOME'];

export const COMMON_PHRASES = [
  'HELLO MY NAME IS', 'I NEED HELP', 'I NEED WATER', 'I NEED FOOD', 'PLEASE HELP', 'THANK YOU',
  'I AM SORRY', 'YES PLEASE', 'NO THANK YOU', 'THIS IS AN EMERGENCY', 'HELP EMERGENCY', 'MY NAME IS',
];

const DICT = new Set([...SIGN_WORDS.flatMap((w) => w.id.split(' ')), ...EXTRA]);
const DICT_LIST = [...DICT];

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function preferByContext(cands, prev) {
  if (prev) {
    const hit = cands.find((c) => COMMON_PHRASES.some((p) => p.includes(`${prev} ${c}`)));
    if (hit) return hit;
  }
  return [...cands].sort((a, b) => a.length - b.length)[0];
}

function fixToken(tok, prev, isLast) {
  if (DICT.has(tok) || tok.length < 2) return tok;
  if (isLast) {
    const prefixed = DICT_LIST.filter((w) => w.startsWith(tok) && w.length > tok.length);
    if (prefixed.length) return preferByContext(prefixed, prev);
  }
  const limit = tok.length >= 6 ? 2 : tok.length >= 4 ? 1 : 0;
  if (!limit) return tok;
  const near = DICT_LIST.filter((w) => distance(tok, w) <= limit);
  return near.length ? preferByContext(near, prev) : tok;
}

/** Returns {text, reason: 'personal' | 'spelling' | 'phrase'} or null. */
export function suggest(sentence) {
  const tokens = tokenize(sentence);
  if (!tokens.length) return null;
  const original = tokens.join(' ');
  const fixed = tokens.map((t, i) => fixToken(t, tokens[i - 1], i === tokens.length - 1)).join(' ');
  const personal = suggestCompletions(fixed)[0];
  if (personal) return { text: personal, reason: 'personal' };
  if (fixed !== original) return { text: fixed, reason: 'spelling' };
  const common = tokens.length >= 2 && COMMON_PHRASES.find((p) => p.startsWith(original + ' '));
  return common ? { text: common, reason: 'phrase' } : null;
}
