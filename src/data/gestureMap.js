// PROTOTYPE gesture map used by the built-in heuristic recognizer.
// Pattern = extended fingers [thumb, index, middle, ring, pinky] (1 = extended, 0 = curled).
// These are simple demo hand shapes - they are NOT real ISL signs.
export const GESTURE_MAP = {
  HELLO: [1, 1, 1, 1, 1],
  YES: [0, 0, 0, 0, 0],
  YOU: [0, 1, 0, 0, 0],
  NO: [0, 1, 1, 0, 0],
  WATER: [0, 1, 1, 1, 0],
  HELP: [0, 1, 1, 1, 1],
  PLEASE: [1, 0, 0, 0, 0],
  'THANK YOU': [1, 0, 0, 0, 1],
  NEED: [1, 1, 0, 0, 0],
  I: [0, 0, 0, 0, 1],
  EMERGENCY: [1, 1, 0, 0, 1],
  SORRY: [0, 1, 0, 0, 1],
  MY: [1, 1, 1, 0, 0],
  FOOD: [1, 0, 1, 1, 1],
  NAME: [0, 0, 1, 1, 0],
  IS: [0, 0, 1, 1, 1],
};

export const patternKey = (p) => p.join('');
export const PATTERN_TO_WORD = Object.fromEntries(Object.entries(GESTURE_MAP).map(([w, p]) => [patternKey(p), w]));
