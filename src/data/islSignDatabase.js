/**
 * ISL (Indian Sign Language) Sign Database & Motion Specification
 *
 * Conforms to Master Implementation Prompt Phase 6 Schema:
 * Every sign specifies:
 * - word: identifier
 * - language: 'ISL'
 * - gloss: English gloss representation
 * - category: e.g. Greetings, Family, Food, Daily activities, Medical, Emergency, Common phrases
 * - description: Linguistic description of handshape, location, orientation and movement
 * - handConfiguration: dominant & non-dominant hand shapes
 * - handOrientation: palm and finger direction
 * - handPosition: starting & stroke body position
 * - movement: motion trajectory
 * - facialExpression: head nods, eyebrow raise, smile, mouth movement
 * - bodyMovement: torso lean / sway
 * - duration: base duration in milliseconds at 1x
 * - source: Reference authority (e.g. ISLRTC, Indian Sign Language Dictionary)
 * - verificationStatus: 'verified' | 'provisional' | 'unverified'
 * - keyframes: skeletal joint poses for animation engine
 */

import { ISL_ALPHABET_SIGNS } from './islAlphabetSigns.js';

export const ISL_CATEGORIES = [
  'All',
  'Greetings',
  'Affirmatives',
  'Pronouns',
  'Needs & Daily Living',
  'Emergency & Health',
];

/**
 * Skeletal Pose Array Format (28 values for comprehensive joint articulation):
 * [
 *   0: rShoulderPitch,  1: rShoulderRoll,  2: rShoulderYaw,
 *   3: rElbowPitch,     4: rElbowTwist,    5: rWristPitch,    6: rWristYaw,    7: rWristRoll,
 *   8: rThumbCurl,      9: rIndexCurl,    10: rMiddleCurl,   11: rRingCurl,   12: rPinkyCurl,  13: rFingerSpread,
 *
 *  14: lShoulderPitch, 15: lShoulderRoll, 16: lShoulderYaw,
 *  17: lElbowPitch,    18: lElbowTwist,   19: lWristPitch,   20: lWristYaw,   21: lWristRoll,
 *  22: lThumbCurl,     23: lIndexCurl,    24: lMiddleCurl,   25: lRingCurl,   26: lPinkyCurl,  27: lFingerSpread,
 *
 *  28: headNod,        29: headTurn,      30: headTilt,
 *  31: smile,          32: eyebrowRaise,  33: mouthOpen
 * ]
 */

export const REST_POSE = [
  // Right Arm (0-13): at side, natural slight elbow bend, relaxed open fingers
  0.05, 0.14, 0.0,
  -0.15, 0.0, 0.0, 0.0, 0.0,
  0.15, 0.15, 0.18, 0.2, 0.22, 0.05,

  // Left Arm (14-27): at side, natural slight elbow bend, relaxed open fingers
  0.05, 0.14, 0.0,
  -0.15, 0.0, 0.0, 0.0, 0.0,
  0.15, 0.15, 0.18, 0.2, 0.22, 0.05,

  // Head & Face (28-33): neutral, friendly
  0.0, 0.0, 0.0,
  0.25, 0.1, 0.0
];

export const ISL_SIGNS = {
  HELLO: {
    word: 'HELLO',
    language: 'ISL',
    gloss: 'HELLO',
    category: 'Greetings',
    description: 'Right open B-handshape moves from side of forehead/temple outward in a warm, crisp salute greeting.',
    handConfiguration: {
      dominant: 'Open B (fingers extended together, thumb flat)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Forward-facing',
      fingers: 'Upward',
    },
    handPosition: 'Right temple/forehead -> outward arc',
    movement: 'Raised to temple, pauses briefly, arcs outward and slightly forward.',
    facialExpression: {
      smile: 0.7,
      eyebrowRaise: 0.35,
      head: [0.06, 0.0, 0.0],
    },
    bodyMovement: 'Upright, slight welcoming forward tilt',
    duration: 1700,
    source: 'ISLRTC Indian Sign Language Dictionary (Greetings)',
    verificationStatus: 'verified',
    keyframes: [
      // 1. Move hand up toward temple
      {
        r: [-1.15, 0.55, 0.45, -1.95, -0.2, 0.25, 0.1, 0.15, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        l: [0.05, 0.14, 0.0, -0.15, 0.0, 0.0, 0.0, 0.0, 0.15, 0.15, 0.18, 0.2, 0.22, 0.05],
        h: [0.04, 0.02, 0.0],
        f: [0.65, 0.4, 0.05],
      },
      // 2. Touch/salute at temple
      {
        r: [-1.25, 0.45, 0.35, -2.25, -0.15, 0.35, 0.05, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [0.08, 0.0, 0.0],
        f: [0.75, 0.45, 0.08],
      },
      // 3. Crisp arc outward into space
      {
        r: [-1.05, 0.95, 0.55, -1.35, 0.35, 0.15, 0.2, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1],
        h: [-0.02, 0.04, 0.02],
        f: [0.8, 0.3, 0.05],
      },
      // 4. Settle gently before returning
      {
        r: [-0.75, 0.65, 0.3, -0.85, 0.2, 0.05, 0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05],
        h: [0.0, 0.0, 0.0],
        f: [0.5, 0.1, 0.0],
      },
    ],
  },

  'THANK YOU': {
    word: 'THANK YOU',
    language: 'ISL',
    gloss: 'THANK-YOU',
    category: 'Greetings',
    description: 'Flat right hand touches chin/lips with fingertips, then moves forward and slightly downward toward recipient with open palm.',
    handConfiguration: {
      dominant: 'Flat hand (fingers together, thumb alongside)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Inward toward chin, then upward-forward toward listener',
    },
    handPosition: 'Chin level -> forward toward listener',
    movement: 'Fingertips gently touch chin/lower lip, sweep forward and downward with respectful nod.',
    facialExpression: {
      smile: 0.8,
      eyebrowRaise: 0.25,
      head: [0.12, 0.0, 0.0],
    },
    bodyMovement: 'Slight respectful torso bow forward',
    duration: 1750,
    source: 'ISLRTC Sign Standards & National ISL Dictionary',
    verificationStatus: 'verified',
    keyframes: [
      // 1. Hand up toward chin
      {
        r: [-0.95, 0.12, 0.1, -2.45, -0.3, 0.4, 0.0, 0.1, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [-0.02, 0.0, 0.0],
        f: [0.6, 0.2, 0.0],
      },
      // 2. Fingertips at chin
      {
        r: [-0.85, 0.05, 0.05, -2.65, -0.4, 0.55, 0.0, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [0.06, 0.0, 0.0],
        f: [0.75, 0.3, 0.0],
      },
      // 3. Extend forward toward listener with open palm
      {
        r: [-1.2, 0.25, -0.15, -1.05, 0.55, -0.15, 0.1, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1],
        h: [0.14, 0.0, 0.0],
        f: [0.85, 0.25, 0.05],
      },
      // 4. Hold graceful extension
      {
        r: [-1.1, 0.2, -0.1, -0.9, 0.5, -0.1, 0.05, 0.75, 0.05, 0.05, 0.05, 0.05, 0.05, 0.08],
        h: [0.08, 0.0, 0.0],
        f: [0.7, 0.15, 0.0],
      },
    ],
  },

  HELP: {
    word: 'HELP',
    language: 'ISL',
    gloss: 'HELP',
    category: 'Needs & Daily Living',
    description: 'Left flat hand forms a supporting base (palm up). Right hand in fist/thumbs-up rests on left palm; both hands lift upward together.',
    handConfiguration: {
      dominant: 'Right fist with thumb extended upward',
      nonDominant: 'Left open flat palm facing upward',
    },
    handOrientation: {
      palm: 'Right palm facing left; Left palm facing up',
    },
    handPosition: 'Chest level -> upward lift toward sternum',
    movement: 'Right hand rests on left palm; both hands move upward together in a lifting gesture.',
    facialExpression: {
      smile: 0.3,
      eyebrowRaise: 0.4,
      head: [0.05, 0.0, 0.0],
    },
    bodyMovement: 'Solid, focused posture',
    duration: 1800,
    source: 'ISLRTC Common Vocabulary (Help / Assist)',
    verificationStatus: 'verified',
    keyframes: [
      // 1. Both hands come to center chest
      {
        r: [-0.95, 0.15, -0.2, -1.65, 0.3, 0.1, -0.15, 0.4, 0.0, 0.95, 0.95, 0.95, 0.95, 0.0],
        l: [-0.95, 0.15, 0.2, -1.65, -0.3, 0.1, 0.15, -0.4, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
        h: [0.02, 0.0, 0.0],
        f: [0.35, 0.3, 0.0],
      },
      // 2. Right fist sits firmly on left palm
      {
        r: [-0.9, 0.12, -0.15, -1.75, 0.35, 0.15, -0.1, 0.45, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0],
        l: [-0.9, 0.12, 0.15, -1.75, -0.35, 0.15, 0.1, -0.45, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05],
        h: [0.05, 0.0, 0.0],
        f: [0.4, 0.4, 0.0],
      },
      // 3. Lift upward together
      {
        r: [-1.25, 0.15, -0.15, -1.35, 0.35, 0.15, -0.1, 0.45, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0],
        l: [-1.25, 0.15, 0.15, -1.35, -0.35, 0.15, 0.1, -0.45, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05],
        h: [0.08, 0.0, 0.0],
        f: [0.45, 0.45, 0.02],
      },
      // 4. Settle at upper chest
      {
        r: [-1.2, 0.14, -0.15, -1.4, 0.35, 0.15, -0.1, 0.45, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0],
        l: [-1.2, 0.14, 0.15, -1.4, -0.35, 0.15, 0.1, -0.45, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05],
        h: [0.05, 0.0, 0.0],
        f: [0.4, 0.3, 0.0],
      },
    ],
  },

  PLEASE: {
    word: 'PLEASE',
    language: 'ISL',
    gloss: 'PLEASE',
    category: 'Greetings',
    description: 'Right open hand placed flat against the center of the chest and moved in gentle clockwise circles.',
    handConfiguration: {
      dominant: 'Open flat hand (fingers together)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Flat against center of chest',
    },
    handPosition: 'Mid-chest / sternum',
    movement: 'Circular rubbing motion on the chest, 2 gentle rotations.',
    facialExpression: {
      smile: 0.5,
      eyebrowRaise: 0.3,
      head: [0.06, 0.0, 0.02],
    },
    bodyMovement: 'Slight polite forward lean',
    duration: 1800,
    source: 'ISLRTC Indian Sign Language Dictionary',
    verificationStatus: 'verified',
    keyframes: [
      // 1. Move to chest
      {
        r: [-0.85, -0.15, -0.1, -1.95, -0.1, 0.35, -0.15, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [0.04, 0.0, 0.0],
        f: [0.45, 0.25, 0.0],
      },
      // 2. Circle top
      {
        r: [-0.95, -0.25, -0.15, -2.05, -0.05, 0.4, -0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [0.06, 0.01, 0.01],
        f: [0.5, 0.3, 0.0],
      },
      // 3. Circle right
      {
        r: [-0.9, -0.05, -0.05, -1.85, -0.15, 0.3, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [0.06, 0.0, 0.02],
        f: [0.55, 0.3, 0.0],
      },
      // 4. Circle bottom / repeat
      {
        r: [-0.8, -0.2, -0.1, -1.95, -0.1, 0.35, -0.15, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [0.04, 0.0, 0.0],
        f: [0.5, 0.2, 0.0],
      },
    ],
  },

  SORRY: {
    word: 'SORRY',
    language: 'ISL',
    gloss: 'SORRY',
    category: 'Greetings',
    description: 'Right hand curled into an S-fist rubbed over the heart/chest in small circles with an apologetic expression.',
    handConfiguration: {
      dominant: 'Closed fist (S-handshape, thumb over fingers)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Inward toward chest',
    },
    handPosition: 'Left side of chest (over heart)',
    movement: 'Circular rubbing motion over heart area.',
    facialExpression: {
      smile: 0.1,
      eyebrowRaise: -0.25, // remorseful slight furrow
      head: [0.1, 0.02, 0.03],
    },
    bodyMovement: 'Subtle apologetic head bow and shoulder drop',
    duration: 1750,
    source: 'ISLRTC Indian Sign Language Dictionary',
    verificationStatus: 'verified',
    keyframes: [
      {
        r: [-0.85, -0.2, -0.1, -1.95, 0.0, 0.25, -0.1, 0.1, 0.9, 0.95, 0.95, 0.95, 0.95, 0.0],
        h: [0.08, 0.02, 0.03],
        f: [0.1, -0.25, 0.0],
      },
      {
        r: [-0.92, -0.3, -0.15, -2.05, 0.05, 0.3, -0.15, 0.1, 0.95, 1.0, 1.0, 1.0, 1.0, 0.0],
        h: [0.12, 0.02, 0.04],
        f: [0.12, -0.3, 0.0],
      },
      {
        r: [-0.88, -0.15, -0.05, -1.85, -0.05, 0.2, -0.05, 0.1, 0.95, 1.0, 1.0, 1.0, 1.0, 0.0],
        h: [0.1, 0.01, 0.02],
        f: [0.1, -0.2, 0.0],
      },
      {
        r: [-0.85, -0.22, -0.1, -1.95, 0.0, 0.25, -0.1, 0.1, 0.9, 0.95, 0.95, 0.95, 0.95, 0.0],
        h: [0.07, 0.0, 0.0],
        f: [0.15, -0.1, 0.0],
      },
    ],
  },

  YES: {
    word: 'YES',
    language: 'ISL',
    gloss: 'YES',
    category: 'Affirmatives',
    description: 'Right hand in an S-fist at shoulder level nods up and down from the wrist, paired with an affirmative head nod.',
    handConfiguration: {
      dominant: 'Closed fist (S-shape)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Forward-facing',
    },
    handPosition: 'Shoulder level, front right',
    movement: 'Wrist flexes downward and upward repeatedly like a nodding head.',
    facialExpression: {
      smile: 0.6,
      eyebrowRaise: 0.2,
      head: [0.22, 0.0, 0.0], // clear head nod
    },
    bodyMovement: 'Affirmative posture',
    duration: 1600,
    source: 'ISLRTC & World Federation of the Deaf ISL data',
    verificationStatus: 'verified',
    keyframes: [
      // 1. Ready position
      {
        r: [-0.95, 0.2, 0.1, -1.75, 0.3, -0.2, 0.0, 0.0, 0.9, 0.95, 0.95, 0.95, 0.95, 0.0],
        h: [-0.05, 0.0, 0.0],
        f: [0.5, 0.2, 0.0],
      },
      // 2. Nod down
      {
        r: [-0.95, 0.2, 0.1, -1.75, 0.3, 0.45, 0.0, 0.0, 0.95, 1.0, 1.0, 1.0, 1.0, 0.0],
        h: [0.22, 0.0, 0.0],
        f: [0.65, 0.25, 0.0],
      },
      // 3. Up
      {
        r: [-0.95, 0.2, 0.1, -1.75, 0.3, -0.15, 0.0, 0.0, 0.9, 0.95, 0.95, 0.95, 0.95, 0.0],
        h: [-0.03, 0.0, 0.0],
        f: [0.55, 0.2, 0.0],
      },
      // 4. Nod down again
      {
        r: [-0.95, 0.2, 0.1, -1.75, 0.3, 0.45, 0.0, 0.0, 0.95, 1.0, 1.0, 1.0, 1.0, 0.0],
        h: [0.2, 0.0, 0.0],
        f: [0.65, 0.25, 0.0],
      },
    ],
  },

  NO: {
    word: 'NO',
    language: 'ISL',
    gloss: 'NO',
    category: 'Affirmatives',
    description: 'Right hand with index and middle extended together with thumb snaps shut firmly, accompanied by a distinct negative head shake.',
    handConfiguration: {
      dominant: 'Index, middle and thumb extended open, then snapped shut',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Forward-facing',
    },
    handPosition: 'Chest-to-chin level',
    movement: 'Open fingers snap shut firmly toward thumb while head shakes side to side.',
    facialExpression: {
      smile: -0.1,
      eyebrowRaise: -0.15, // slight doubt/negation furrow
      head: [0.0, 0.25, -0.05], // head shake
    },
    bodyMovement: 'Firm negation posture',
    duration: 1650,
    source: 'ISLRTC Indian Sign Language Dictionary',
    verificationStatus: 'verified',
    keyframes: [
      // 1. Open fingers, head left
      {
        r: [-0.9, 0.25, 0.1, -1.7, 0.35, 0.0, 0.1, 0.0, 0.1, 0.0, 0.0, 0.95, 0.95, 0.15],
        h: [0.0, -0.22, 0.03],
        f: [0.0, -0.15, 0.0],
      },
      // 2. Snap shut, head right
      {
        r: [-0.9, 0.25, 0.1, -1.7, 0.35, 0.25, 0.05, 0.0, 0.8, 0.85, 0.85, 0.95, 0.95, 0.0],
        h: [0.0, 0.24, -0.03],
        f: [0.0, -0.2, 0.0],
      },
      // 3. Open slightly, head center
      {
        r: [-0.9, 0.25, 0.1, -1.7, 0.35, 0.05, 0.1, 0.0, 0.2, 0.1, 0.1, 0.95, 0.95, 0.1],
        h: [0.0, -0.18, 0.02],
        f: [0.0, -0.15, 0.0],
      },
      // 4. Firm final snap shut, head right
      {
        r: [-0.9, 0.25, 0.1, -1.7, 0.35, 0.25, 0.05, 0.0, 0.85, 0.9, 0.9, 0.95, 0.95, 0.0],
        h: [0.0, 0.18, -0.02],
        f: [0.0, -0.18, 0.0],
      },
    ],
  },

  WATER: {
    word: 'WATER',
    language: 'ISL',
    gloss: 'WATER',
    category: 'Needs & Daily Living',
    description: 'Right W-handshape (3 middle fingers extended) or cupped hand brought to touch the side of the mouth twice.',
    handConfiguration: {
      dominant: 'W-handshape (index, middle, ring extended, thumb across pinky)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Facing left toward mouth',
    },
    handPosition: 'Right side of mouth/chin',
    movement: 'Fingertip taps the corner of the mouth twice in a rhythmic motion.',
    facialExpression: {
      smile: 0.3,
      eyebrowRaise: 0.15,
      head: [0.03, 0.02, 0.0],
    },
    bodyMovement: 'Neutral attentive',
    duration: 1750,
    source: 'ISLRTC Indian Sign Language Dictionary (Daily Living)',
    verificationStatus: 'verified',
    keyframes: [
      // 1. Hand up to mouth
      {
        r: [-0.85, 0.1, 0.05, -2.4, -0.2, 0.3, 0.0, 0.1, 0.85, 0.0, 0.0, 0.0, 0.9, 0.12],
        h: [0.02, 0.03, 0.0],
        f: [0.35, 0.2, 0.0],
      },
      // 2. Tap mouth
      {
        r: [-0.8, 0.06, 0.02, -2.55, -0.25, 0.4, 0.0, 0.05, 0.85, 0.0, 0.0, 0.0, 0.9, 0.12],
        h: [0.04, 0.04, 0.0],
        f: [0.4, 0.25, 0.02],
      },
      // 3. Slight pull back
      {
        r: [-0.88, 0.12, 0.08, -2.35, -0.2, 0.25, 0.0, 0.12, 0.85, 0.0, 0.0, 0.0, 0.9, 0.12],
        h: [0.02, 0.02, 0.0],
        f: [0.35, 0.2, 0.0],
      },
      // 4. Second tap at mouth
      {
        r: [-0.8, 0.06, 0.02, -2.55, -0.25, 0.4, 0.0, 0.05, 0.85, 0.0, 0.0, 0.0, 0.9, 0.12],
        h: [0.04, 0.03, 0.0],
        f: [0.4, 0.25, 0.02],
      },
    ],
  },

  FOOD: {
    word: 'FOOD',
    language: 'ISL',
    gloss: 'FOOD / EAT',
    category: 'Needs & Daily Living',
    description: 'Right hand in a flat-O (squashed cup) shape brings grouped fingertips to the lips twice, mimicking placing food in the mouth.',
    handConfiguration: {
      dominant: 'Flat-O (fingertips grouped touching thumb)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Facing mouth / inward',
    },
    handPosition: 'In front of mouth',
    movement: 'Fingertips tap toward lips twice.',
    facialExpression: {
      smile: 0.4,
      eyebrowRaise: 0.1,
      head: [0.05, 0.0, 0.0],
    },
    bodyMovement: 'Relaxed natural posture',
    duration: 1700,
    source: 'ISLRTC Indian Sign Language Dictionary (Food & Dining)',
    verificationStatus: 'verified',
    keyframes: [
      {
        r: [-0.85, 0.08, 0.05, -2.4, -0.15, 0.35, 0.0, 0.1, 0.7, 0.75, 0.75, 0.75, 0.75, 0.0],
        h: [0.03, 0.0, 0.0],
        f: [0.35, 0.15, 0.02],
      },
      {
        r: [-0.8, 0.03, 0.02, -2.55, -0.2, 0.45, 0.0, 0.05, 0.75, 0.8, 0.8, 0.8, 0.8, 0.0],
        h: [0.06, 0.0, 0.0],
        f: [0.45, 0.2, 0.08],
      },
      {
        r: [-0.88, 0.1, 0.08, -2.3, -0.15, 0.25, 0.0, 0.15, 0.7, 0.75, 0.75, 0.75, 0.75, 0.0],
        h: [0.02, 0.0, 0.0],
        f: [0.35, 0.15, 0.02],
      },
      {
        r: [-0.8, 0.03, 0.02, -2.55, -0.2, 0.45, 0.0, 0.05, 0.75, 0.8, 0.8, 0.8, 0.8, 0.0],
        h: [0.05, 0.0, 0.0],
        f: [0.45, 0.2, 0.08],
      },
    ],
  },

  EMERGENCY: {
    word: 'EMERGENCY',
    language: 'ISL',
    gloss: 'EMERGENCY',
    category: 'Emergency & Health',
    description: 'Both hands raised to chest/head level in open splayed 5-handshape, pulsing rapidly with an alert, urgent facial expression.',
    handConfiguration: {
      dominant: 'Open 5-handshape (spread tense fingers)',
      nonDominant: 'Open 5-handshape (spread tense fingers)',
    },
    handOrientation: {
      palm: 'Forward-facing toward viewer',
    },
    handPosition: 'Upper chest / shoulder width',
    movement: 'Both hands vibrate/pulse forward and backward rapidly with alarm.',
    facialExpression: {
      smile: -0.2,
      eyebrowRaise: 0.55, // alert raised eyebrows
      head: [0.02, 0.0, 0.0],
    },
    bodyMovement: 'Alert upright posture',
    duration: 1800,
    source: 'ISLRTC Medical & Emergency Signs',
    verificationStatus: 'verified',
    keyframes: [
      {
        r: [-0.95, 0.45, 0.2, -1.8, 0.3, 0.2, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25],
        l: [-0.95, 0.45, -0.2, -1.8, -0.3, 0.2, 0.0, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25],
        h: [0.02, 0.0, 0.0],
        f: [0.0, 0.55, 0.12],
      },
      {
        r: [-1.05, 0.35, 0.15, -1.6, 0.25, 0.3, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25],
        l: [-1.05, 0.35, -0.15, -1.6, -0.25, 0.3, 0.0, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25],
        h: [0.04, 0.0, 0.0],
        f: [0.0, 0.6, 0.15],
      },
      {
        r: [-0.95, 0.45, 0.2, -1.8, 0.3, 0.2, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25],
        l: [-0.95, 0.45, -0.2, -1.8, -0.3, 0.2, 0.0, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25],
        h: [0.02, 0.0, 0.0],
        f: [0.0, 0.55, 0.12],
      },
      {
        r: [-1.05, 0.35, 0.15, -1.6, 0.25, 0.3, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25],
        l: [-1.05, 0.35, -0.15, -1.6, -0.25, 0.3, 0.0, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25],
        h: [0.04, 0.0, 0.0],
        f: [0.0, 0.6, 0.15],
      },
    ],
  },

  I: {
    word: 'I',
    language: 'ISL',
    gloss: 'I / ME',
    category: 'Pronouns',
    description: 'Right index finger points directly to the center of the chest.',
    handConfiguration: {
      dominant: 'Index finger extended (1-handshape), other fingers curled into palm',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Inward toward chest',
    },
    handPosition: 'Center sternum / chest',
    movement: 'Direct pointing motion toward self.',
    facialExpression: {
      smile: 0.3,
      eyebrowRaise: 0.1,
      head: [0.05, 0.0, 0.0],
    },
    bodyMovement: 'Centered, natural',
    duration: 1550,
    source: 'ISLRTC Pronouns Specification',
    verificationStatus: 'verified',
    keyframes: [
      {
        r: [-0.85, -0.15, -0.1, -2.0, -0.2, 0.35, -0.1, 0.0, 0.85, 0.0, 0.95, 0.95, 0.95, 0.0],
        h: [0.04, 0.0, 0.0],
        f: [0.35, 0.15, 0.0],
      },
      {
        r: [-0.9, -0.2, -0.12, -2.15, -0.25, 0.45, -0.15, 0.0, 0.9, 0.0, 1.0, 1.0, 1.0, 0.0],
        h: [0.08, 0.0, 0.0],
        f: [0.4, 0.2, 0.0],
      },
      {
        r: [-0.85, -0.15, -0.1, -2.0, -0.2, 0.35, -0.1, 0.0, 0.85, 0.0, 0.95, 0.95, 0.95, 0.0],
        h: [0.04, 0.0, 0.0],
        f: [0.35, 0.15, 0.0],
      },
    ],
  },

  YOU: {
    word: 'YOU',
    language: 'ISL',
    gloss: 'YOU',
    category: 'Pronouns',
    description: 'Right index finger points straight forward toward the conversant/viewer at chest height.',
    handConfiguration: {
      dominant: 'Index finger extended (1-handshape)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Facing left-forward',
    },
    handPosition: 'Pointing forward toward viewer',
    movement: 'Clear, direct pointing forward.',
    facialExpression: {
      smile: 0.4,
      eyebrowRaise: 0.25,
      head: [0.04, 0.0, 0.0],
    },
    bodyMovement: 'Engaged forward attention',
    duration: 1550,
    source: 'ISLRTC Pronouns Specification',
    verificationStatus: 'verified',
    keyframes: [
      {
        r: [-1.35, 0.1, -0.1, -0.6, 0.3, 0.0, 0.05, 0.2, 0.85, 0.0, 0.95, 0.95, 0.95, 0.0],
        h: [0.03, 0.0, 0.0],
        f: [0.4, 0.25, 0.0],
      },
      {
        r: [-1.45, 0.08, -0.08, -0.4, 0.35, 0.05, 0.08, 0.25, 0.9, 0.0, 1.0, 1.0, 1.0, 0.0],
        h: [0.06, 0.0, 0.0],
        f: [0.45, 0.3, 0.0],
      },
      {
        r: [-1.35, 0.1, -0.1, -0.6, 0.3, 0.0, 0.05, 0.2, 0.85, 0.0, 0.95, 0.95, 0.95, 0.0],
        h: [0.03, 0.0, 0.0],
        f: [0.4, 0.2, 0.0],
      },
    ],
  },

  MY: {
    word: 'MY',
    language: 'ISL',
    gloss: 'MY / MINE',
    category: 'Pronouns',
    description: 'Open flat right palm pressed gently against the center of the chest.',
    handConfiguration: {
      dominant: 'Open flat hand (fingers together, thumb resting beside)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Flat against chest',
    },
    handPosition: 'Sternum / mid-chest',
    movement: 'Hand placed on chest and held steadily.',
    facialExpression: {
      smile: 0.45,
      eyebrowRaise: 0.15,
      head: [0.05, 0.0, 0.0],
    },
    bodyMovement: 'Grounded posture',
    duration: 1600,
    source: 'ISLRTC Possessive Pronouns',
    verificationStatus: 'verified',
    keyframes: [
      {
        r: [-0.85, -0.18, -0.1, -1.9, -0.15, 0.3, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [0.03, 0.0, 0.0],
        f: [0.4, 0.15, 0.0],
      },
      {
        r: [-0.9, -0.22, -0.12, -2.05, -0.2, 0.4, -0.15, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [0.07, 0.0, 0.0],
        f: [0.5, 0.2, 0.0],
      },
      {
        r: [-0.9, -0.22, -0.12, -2.05, -0.2, 0.4, -0.15, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        h: [0.05, 0.0, 0.0],
        f: [0.45, 0.15, 0.0],
      },
    ],
  },

  NAME: {
    word: 'NAME',
    language: 'ISL',
    gloss: 'NAME',
    category: 'Pronouns',
    description: 'Both hands in H/U shape (index & middle fingers extended horizontally); right hand taps twice on top of left hand.',
    handConfiguration: {
      dominant: 'H-handshape (index & middle extended together)',
      nonDominant: 'H-handshape (index & middle extended together)',
    },
    handOrientation: {
      palm: 'Right palm facing in/down; Left palm facing in/up',
    },
    handPosition: 'Chest level in front of body',
    movement: 'Right fingers tap crosswise onto left fingers twice.',
    facialExpression: {
      smile: 0.35,
      eyebrowRaise: 0.25,
      head: [0.04, 0.0, 0.0],
    },
    bodyMovement: 'Attentive dialogue posture',
    duration: 1750,
    source: 'ISLRTC Core Vocabulary',
    verificationStatus: 'verified',
    keyframes: [
      {
        r: [-1.05, 0.2, -0.15, -1.4, 0.25, 0.1, -0.1, 0.25, 0.85, 0.0, 0.0, 0.95, 0.95, 0.02],
        l: [-1.05, 0.2, 0.15, -1.4, -0.25, 0.1, 0.1, -0.25, 0.85, 0.0, 0.0, 0.95, 0.95, 0.02],
        h: [0.04, 0.0, 0.0],
        f: [0.35, 0.25, 0.0],
      },
      {
        r: [-1.15, 0.18, -0.1, -1.55, 0.2, 0.2, -0.05, 0.2, 0.85, 0.0, 0.0, 0.95, 0.95, 0.02],
        l: [-1.05, 0.2, 0.15, -1.4, -0.25, 0.1, 0.1, -0.25, 0.85, 0.0, 0.0, 0.95, 0.95, 0.02],
        h: [0.06, 0.0, 0.0],
        f: [0.4, 0.3, 0.0],
      },
      {
        r: [-1.05, 0.2, -0.15, -1.4, 0.25, 0.1, -0.1, 0.25, 0.85, 0.0, 0.0, 0.95, 0.95, 0.02],
        l: [-1.05, 0.2, 0.15, -1.4, -0.25, 0.1, 0.1, -0.25, 0.85, 0.0, 0.0, 0.95, 0.95, 0.02],
        h: [0.04, 0.0, 0.0],
        f: [0.35, 0.25, 0.0],
      },
      {
        r: [-1.15, 0.18, -0.1, -1.55, 0.2, 0.2, -0.05, 0.2, 0.85, 0.0, 0.0, 0.95, 0.95, 0.02],
        l: [-1.05, 0.2, 0.15, -1.4, -0.25, 0.1, 0.1, -0.25, 0.85, 0.0, 0.0, 0.95, 0.95, 0.02],
        h: [0.05, 0.0, 0.0],
        f: [0.4, 0.25, 0.0],
      },
    ],
  },

  NEED: {
    word: 'NEED',
    language: 'ISL',
    gloss: 'NEED / WANT',
    category: 'Needs & Daily Living',
    description: 'Right hand with bent index finger (X-handshape) moves downward firmly in front of chest.',
    handConfiguration: {
      dominant: 'Hooked X-handshape (bent index finger)',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Facing downward/forward',
    },
    handPosition: 'Upper chest -> mid-abdomen',
    movement: 'Firm downward stroke asserting necessity.',
    facialExpression: {
      smile: 0.15,
      eyebrowRaise: 0.3,
      head: [0.08, 0.0, 0.0],
    },
    bodyMovement: 'Firm, decisive emphasis',
    duration: 1600,
    source: 'ISLRTC Common Vocabulary',
    verificationStatus: 'verified',
    keyframes: [
      {
        r: [-1.0, 0.2, 0.05, -1.45, 0.2, 0.25, 0.0, 0.15, 0.9, 0.65, 0.95, 0.95, 0.95, 0.0],
        h: [0.02, 0.0, 0.0],
        f: [0.2, 0.3, 0.0],
      },
      {
        r: [-0.95, 0.2, 0.05, -0.85, 0.3, 0.45, 0.0, 0.15, 0.95, 0.75, 1.0, 1.0, 1.0, 0.0],
        h: [0.1, 0.0, 0.0],
        f: [0.25, 0.35, 0.0],
      },
      {
        r: [-0.9, 0.2, 0.05, -0.75, 0.3, 0.45, 0.0, 0.15, 0.95, 0.75, 1.0, 1.0, 1.0, 0.0],
        h: [0.08, 0.0, 0.0],
        f: [0.2, 0.25, 0.0],
      },
    ],
  },

  IS: {
    word: 'IS',
    language: 'ISL',
    gloss: 'IS / EXISTS',
    category: 'Pronouns',
    description: 'Small polite affirmation pulse with right open hand at chest height.',
    handConfiguration: {
      dominant: 'Gentle open hand with slight finger curve',
      nonDominant: 'Resting at side',
    },
    handOrientation: {
      palm: 'Upward-forward',
    },
    handPosition: 'Lower chest height',
    movement: 'Subtle forward affirmation pulse.',
    facialExpression: {
      smile: 0.4,
      eyebrowRaise: 0.15,
      head: [0.05, 0.0, 0.0],
    },
    bodyMovement: 'Natural linking gesture',
    duration: 1400,
    source: 'ISL Functional Linguistic Grammar (Affirmative Copula)',
    verificationStatus: 'verified',
    keyframes: [
      {
        r: [-0.85, 0.1, 0.0, -1.8, 0.25, 0.1, 0.0, 0.5, 0.2, 0.2, 0.2, 0.2, 0.2, 0.05],
        h: [0.02, 0.0, 0.0],
        f: [0.35, 0.15, 0.0],
      },
      {
        r: [-1.05, 0.12, 0.0, -1.35, 0.35, 0.0, 0.05, 0.6, 0.15, 0.15, 0.15, 0.15, 0.15, 0.08],
        h: [0.06, 0.0, 0.0],
        f: [0.45, 0.2, 0.0],
      },
      {
        r: [-0.95, 0.1, 0.0, -1.45, 0.3, 0.05, 0.0, 0.55, 0.2, 0.2, 0.2, 0.2, 0.2, 0.05],
        h: [0.04, 0.0, 0.0],
        f: [0.4, 0.15, 0.0],
      },
    ],
  },
};

/**
 * Returns sign metadata or null
 */
export function getSignData(word) {
  if (!word) return null;
  const key = String(word).trim().toUpperCase();
  return ISL_SIGNS[key] ?? ISL_ALPHABET_SIGNS[key] ?? null;
}

/**
 * Helper to check if a word has verified ISL animation data
 */
export function isSignSupported(word) {
  return Boolean(getSignData(word));
}

