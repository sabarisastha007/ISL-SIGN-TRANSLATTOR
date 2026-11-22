// Word -> animation name -> keyframes. Swap this file (or load a GLTF clip per animation name)
// to replace the placeholder gestures. All animations here are PROTOTYPE gestures, not accurate ISL.
//
// Pose = { r:[shoulderX, shoulderOut, elbowBend], l:[...], h:[headNod, headTurn], c:[rightCurl, leftCurl] }
//   shoulderX: negative = raise arm forward   shoulderOut: positive = swing outward
//   elbowBend: negative = bend forearm upward  curl: 0 open hand .. 1 fist
// Any missing part falls back to the resting pose.
export const REST = [0, 0.12, -0.05, 0, 0.12, -0.05, 0, 0, 0, 0];

export const buildPose = (k) => [
  ...(k.r ?? REST.slice(0, 3)),
  ...(k.l ?? REST.slice(3, 6)),
  ...(k.h ?? [0, 0]),
  ...(k.c ?? [0, 0]),
];

export const SIGN_ANIMATION_MAP = {
  HELLO: 'hello',
  HELP: 'help',
  'THANK YOU': 'thankYou',
  SORRY: 'sorry',
  YES: 'yes',
  NO: 'no',
  WATER: 'water',
  FOOD: 'food',
  PLEASE: 'please',
  EMERGENCY: 'emergency',
  I: 'me',
  YOU: 'you',
  MY: 'my',
  NAME: 'name',
  NEED: 'need',
  IS: 'is',
};

export const ANIMATIONS = {
  hello: [
    { r: [-1.0, 1.0, -1.7], c: [0, 0] },
    { r: [-1.0, 0.35, -1.7], c: [0, 0] },
    { r: [-1.0, 1.0, -1.7], c: [0, 0] },
    { r: [-1.0, 0.35, -1.7], c: [0, 0] },
  ],
  help: [
    { r: [-1.0, 0.25, -1.4], l: [-1.1, 0.25, -1.1], c: [0, 0.3] },
    { r: [-1.0, 0.25, -1.4], l: [-1.4, 0.25, -1.1], c: [0, 0.3] },
    { r: [-1.0, 0.25, -1.4], l: [-1.1, 0.25, -1.1], c: [0, 0.3] },
  ],
  thankYou: [
    { r: [-0.8, 0.05, -2.3], c: [0, 0] },
    { r: [-1.3, 0.3, -1.0], c: [0, 0] },
  ],
  sorry: [
    { r: [-0.9, -0.15, -1.9], c: [1, 0] },
    { r: [-0.9, -0.4, -1.9], c: [1, 0] },
    { r: [-0.9, -0.15, -1.9], c: [1, 0] },
    { r: [-0.9, -0.4, -1.9], c: [1, 0] },
  ],
  yes: [
    { r: [-0.9, 0.1, -1.6], c: [1, 0], h: [0.3, 0] },
    { r: [-0.9, 0.1, -1.6], c: [1, 0], h: [-0.05, 0] },
    { r: [-0.9, 0.1, -1.6], c: [1, 0], h: [0.3, 0] },
  ],
  no: [
    { r: [-0.9, 0.2, -1.6], c: [0.5, 0], h: [0, 0.4] },
    { r: [-0.9, 0.2, -1.6], c: [0.5, 0], h: [0, -0.4] },
    { r: [-0.9, 0.2, -1.6], c: [0.5, 0], h: [0, 0] },
  ],
  water: [
    { r: [-0.8, 0.1, -2.2], c: [0.3, 0] },
    { r: [-0.9, 0.1, -2.0], c: [0.3, 0] },
    { r: [-0.8, 0.1, -2.2], c: [0.3, 0] },
  ],
  food: [
    { r: [-0.8, 0.05, -2.3], c: [0.8, 0] },
    { r: [-1.0, 0.1, -1.9], c: [0.8, 0] },
    { r: [-0.8, 0.05, -2.3], c: [0.8, 0] },
  ],
  please: [
    { r: [-1.0, -0.3, -1.8], c: [0, 0] },
    { r: [-1.0, -0.05, -1.8], c: [0, 0] },
    { r: [-1.0, -0.3, -1.8], c: [0, 0] },
  ],
  emergency: [
    { r: [-0.9, 0.7, -2.0], l: [-0.9, 0.7, -2.0], c: [0.6, 0.6] },
    { r: [-0.9, 0.4, -2.0], l: [-0.9, 0.4, -2.0], c: [0.6, 0.6] },
    { r: [-0.9, 0.7, -2.0], l: [-0.9, 0.7, -2.0], c: [0.6, 0.6] },
    { r: [-0.9, 0.4, -2.0], l: [-0.9, 0.4, -2.0], c: [0.6, 0.6] },
  ],
  me: [{ r: [-0.9, -0.3, -1.9], c: [0.8, 0] }],
  you: [{ r: [-1.4, 0.1, -0.4], c: [0.8, 0] }],
  my: [{ r: [-0.9, -0.3, -1.8], c: [0, 0] }],
  name: [
    { r: [-1.1, 0.2, -1.2], l: [-1.1, 0.2, -1.2], c: [0.5, 0.5] },
    { r: [-1.1, 0.2, -1.2], l: [-1.3, 0.2, -1.2], c: [0.5, 0.5] },
    { r: [-1.1, 0.2, -1.2], l: [-1.1, 0.2, -1.2], c: [0.5, 0.5] },
  ],
  need: [
    { r: [-1.0, 0.2, -1.3], c: [1, 0] },
    { r: [-1.0, 0.2, -0.8], c: [1, 0] },
  ],
  is: [
    { r: [-0.8, 0.0, -2.1], c: [0.6, 0] },
    { r: [-1.1, 0.1, -1.4], c: [0.6, 0] },
  ],
};
