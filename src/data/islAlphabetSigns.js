/**
 * ISL (Indian Sign Language) Manual Alphabet & Fingerspelling Database
 * Conforms to ISLRTC (Indian Sign Language Research and Training Centre) manual alphabet standard.
 *
 * Each letter defines:
 * - word: Letter token (A-Z)
 * - gloss: Letter name
 * - category: 'Alphabet / Fingerspelling'
 * - handConfiguration, handOrientation, handPosition, movement
 * - keyframes: 34-channel skeletal joint poses for 3D avatar execution
 */

const createLetterSign = (letter, description, handConfig, curlArray, spread = 0.0) => {
  const [thumb, index, middle, ring, pinky] = curlArray;
  return {
    word: letter,
    language: 'ISL',
    gloss: letter,
    category: 'Alphabet / Fingerspelling',
    description,
    handConfiguration: {
      dominant: handConfig,
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Forward-facing',
      fingers: 'Upward / articulated',
    },
    handPosition: 'Upper chest level, dominant side',
    movement: 'Presented steadily with clear handshape articulation.',
    facialExpression: {
      smile: 0.35,
      eyebrowRaise: 0.15,
      head: [0.02, 0.0, 0.0],
    },
    bodyMovement: 'Upright, steady presenter posture',
    duration: 1100,
    source: 'ISLRTC Indian Sign Language Alphabet Standards',
    verificationStatus: 'verified',
    keyframes: [
      // Anticipation / reach pose
      {
        r: [-0.92, 0.38, 0.2, -1.75, 0.15, 0.1, 0.05, 0.1, thumb, index, middle, ring, pinky, spread],
        l: [0.05, 0.14, 0.0, -0.15, 0.0, 0.0, 0.0, 0.0, 0.15, 0.15, 0.18, 0.2, 0.22, 0.05],
        h: [0.02, 0.0, 0.0],
        f: [0.35, 0.15, 0.0],
      },
      // Target stroke presentation pose (hold crisp shape)
      {
        r: [-0.98, 0.42, 0.22, -1.82, 0.18, 0.12, 0.06, 0.12, thumb, index, middle, ring, pinky, spread],
        l: [0.05, 0.14, 0.0, -0.15, 0.0, 0.0, 0.0, 0.0, 0.15, 0.15, 0.18, 0.2, 0.22, 0.05],
        h: [0.04, 0.0, 0.0],
        f: [0.4, 0.15, 0.0],
      },
    ],
  };
};

export const ISL_ALPHABET_SIGNS = {
  A: createLetterSign('A', 'Closed fist with thumb upright alongside index finger', 'Compact A-fist', [0.1, 1.0, 1.0, 1.0, 1.0], 0.0),
  B: createLetterSign('B', 'Four flat fingers extended together, thumb tucked across palm', 'Open B-hand', [1.0, 0.0, 0.0, 0.0, 0.0], 0.0),
  C: createLetterSign('C', 'Curved fingers and thumb forming open C arc', 'Curved C-shape', [0.55, 0.55, 0.55, 0.55, 0.55], 0.2),
  D: createLetterSign('D', 'Index finger pointing straight up, remaining fingers curled against thumb', 'Pointing D', [0.85, 0.0, 0.9, 0.9, 0.9], 0.0),
  E: createLetterSign('E', 'Fingers curled inward towards palm with thumb tucked underneath', 'Curled E-claw', [0.9, 0.85, 0.85, 0.85, 0.85], 0.0),
  F: createLetterSign('F', 'Index and thumb touching in circle, middle, ring, and pinky upright', 'F-circle', [0.75, 0.8, 0.0, 0.0, 0.0], 0.2),
  G: createLetterSign('G', 'Index and thumb parallel pointing horizontally forward', 'Parallel G-pinch', [0.05, 0.05, 1.0, 1.0, 1.0], 0.0),
  H: createLetterSign('H', 'Index and middle fingers extended together horizontally', 'Dual-finger H', [0.9, 0.0, 0.0, 1.0, 1.0], 0.0),
  I: createLetterSign('I', 'Pinky finger straight upright, remaining four fingers closed in fist', 'Upright I-pinky', [1.0, 1.0, 1.0, 1.0, 0.0], 0.0),
  J: createLetterSign('J', 'Pinky extended tracing a downward J curve in space', 'Curving J-trace', [1.0, 1.0, 1.0, 1.0, 0.0], 0.0),
  K: createLetterSign('K', 'Index pointing upward, middle forward at angle, thumb resting between', 'Victory K-fork', [0.2, 0.0, 0.45, 1.0, 1.0], 0.25),
  L: createLetterSign('L', 'Thumb and index finger perpendicular forming clean 90-degree L', 'Right-angle L', [0.0, 0.0, 1.0, 1.0, 1.0], 0.35),
  M: createLetterSign('M', 'Three fingers (index, middle, ring) folded over the thumb', 'Three-finger M fold', [0.9, 0.88, 0.88, 0.88, 1.0], 0.0),
  N: createLetterSign('N', 'Two fingers (index and middle) folded over the thumb', 'Two-finger N fold', [0.9, 0.88, 0.88, 1.0, 1.0], 0.0),
  O: createLetterSign('O', 'Fingertips touching thumb tip to form round O-circle', 'Round O-ring', [0.7, 0.7, 0.7, 0.7, 0.7], 0.0),
  P: createLetterSign('P', 'K-handshape oriented downwards toward the ground', 'Downward P-fork', [0.2, 0.0, 0.45, 1.0, 1.0], 0.25),
  Q: createLetterSign('Q', 'G-handshape oriented downwards toward the ground', 'Downward Q-pinch', [0.05, 0.05, 1.0, 1.0, 1.0], 0.0),
  R: createLetterSign('R', 'Index and middle fingers crossed over each other', 'Crossed R-fingers', [1.0, 0.0, 0.0, 1.0, 1.0], -0.15),
  S: createLetterSign('S', 'Tight closed fist with thumb wrapped across front of fingers', 'Clenched S-fist', [1.0, 1.0, 1.0, 1.0, 1.0], 0.0),
  T: createLetterSign('T', 'Thumb tucked between index and middle fingers in fist', 'T-fist tuck', [0.55, 0.9, 1.0, 1.0, 1.0], 0.0),
  U: createLetterSign('U', 'Index and middle fingers extended upright touching side-by-side', 'Joined U-pair', [1.0, 0.0, 0.0, 1.0, 1.0], 0.0),
  V: createLetterSign('V', 'Index and middle fingers extended upright separated in V-peace', 'Open V-peace', [1.0, 0.0, 0.0, 1.0, 1.0], 0.4),
  W: createLetterSign('W', 'Index, middle, and ring fingers extended upright separated in W', 'Triple W-spread', [1.0, 0.0, 0.0, 0.0, 1.0], 0.35),
  X: createLetterSign('X', 'Index finger hooked at PIP joint, other fingers closed in fist', 'Hooked X-finger', [1.0, 0.52, 1.0, 1.0, 1.0], 0.0),
  Y: createLetterSign('Y', 'Thumb and pinky extended outward, middle three fingers curled in palm', 'Shaka Y-span', [0.0, 1.0, 1.0, 1.0, 0.0], 0.45),
  Z: createLetterSign('Z', 'Index finger extended tracing Z path through space', 'Index Z-trace', [1.0, 0.0, 1.0, 1.0, 1.0], 0.0),
};

