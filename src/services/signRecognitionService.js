// ---------------------------------------------------------------------------------------------
// Sign recognition service. The UI only talks to this file, so a trained ISL model can replace
// the heuristic below without touching any component.
//
//   initRecognition()            load MediaPipe HandLandmarker (WASM served from /public, model from CDN)
//   recognizeFrame(video, ts)    -> { handDetected, landmarks, word, confidence }
//   setRecognitionModel(fn)      plug in your own classifier: fn(landmarks) -> { word, confidence } | null
//   createStabilizer()           debounce + cooldown so a held gesture adds a word only once
// ---------------------------------------------------------------------------------------------
import { PATTERN_TO_WORD, patternKey } from '../data/gestureMap.js';

const WASM_PATH = `${import.meta.env?.BASE_URL ?? '/'}mediapipe/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

let landmarker = null;
let customModel = null;
let tfModel = null;
let tf = null;

export async function initRecognition() {
  if (landmarker) return;
  const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  const make = (delegate) =>
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numHands: 2,
    });
  try { landmarker = await make('GPU'); } catch { landmarker = await make('CPU'); }
}

export function disposeRecognition() {
  landmarker?.close();
  landmarker = null;
}

/** Replace the demo classifier with a trained model: fn(landmarks[21]) -> { word, confidence } | null */
export const setRecognitionModel = (fn) => { customModel = fn; };

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// --- Prototype heuristic: which fingers are extended? (orientation independent) ---
function fingerPattern(lm) {
  const wrist = lm[0];
  const ratios = [[8, 6], [12, 10], [16, 14], [20, 18]].map(([tip, pip]) => dist(lm[tip], wrist) / dist(lm[pip], wrist));
  const thumb = dist(lm[4], lm[17]) / dist(lm[3], lm[17]);
  const thr = [1.1, 1.15, 1.15, 1.15, 1.15];
  const all = [thumb, ...ratios];
  const pattern = all.map((r, i) => (r > thr[i] ? 1 : 0));
  const margin = all.reduce((s, r, i) => s + Math.min(1, Math.abs(r - thr[i]) / 0.3), 0) / 5;
  return { pattern, confidence: 0.55 + 0.4 * margin };
}

export function classifyLandmarks(lm) {
  if (customModel) return customModel(lm) ?? { word: null, confidence: 0 };
  const { pattern, confidence } = fingerPattern(lm);
  const word = PATTERN_TO_WORD[patternKey(pattern)] ?? null;
  return { word, confidence: word ? confidence : 0 };
}

export function recognizeFrame(video, timestamp) {
  if (!landmarker) return { handDetected: false, landmarks: null, allLandmarks: [], word: null, confidence: 0 };
  const result = landmarker.detectForVideo(video, timestamp);
  const allLm = result?.landmarks ?? [];
  const lm = allLm[0] ?? null;
  if (!lm) return { handDetected: false, landmarks: null, allLandmarks: [], word: null, confidence: 0 };
  const { word, confidence } = classifyLandmarks(lm);
  return { handDetected: true, landmarks: lm, allLandmarks: allLm, word, confidence };
}

/**
 * Temporal stabilizer for gesture recognition.
 * Features:
 * - Hold duration requirement (holdMs): gesture must be held steadily before committing
 * - Jitter / drop tolerance (jitterToleranceMs): momentary dropped detections or single-frame noise don't immediately reset hold progress
 * - Duplicate suppression: holding a gesture continuously commits it once and stays locked
 * - Release detection (releaseMs): requires a brief intentional release/change before allowing the same sign to be committed again (repeated-letter support)
 * - Cooldown (cooldownMs): minimum time between any two committed words
 * - Progress indicator (0.0 to 1.0)
 * - Reset method for clean camera stop/start
 */
export function createStabilizer({
  holdMs = 650,
  cooldownMs = 600,
  jitterToleranceMs = 150,
  releaseMs = 200,
} = {}) {
  let candidate = null;
  let since = 0;
  let lastSeen = 0;
  let lastCommit = -Infinity;
  let locked = null;

  return {
    update(word, now) {
      // 1. If no word detected:
      if (!word) {
        if (candidate && now - lastSeen <= jitterToleranceMs) {
          // Momentary drop within jitter tolerance: keep candidate active
          return null;
        }
        candidate = null;
        if (locked && now - lastSeen >= releaseMs) {
          locked = null;
        }
        return null;
      }

      // 2. Gesture changed from current candidate:
      if (word !== candidate) {
        // If candidate was in-progress (not locked) and last seen recently, treat 1 unexpected frame as flicker
        if (candidate && !locked && now - since > jitterToleranceMs && now - lastSeen <= jitterToleranceMs) {
          return null;
        }
        candidate = word;
        since = now;
        // If hand was absent for at least releaseMs, or if new word differs from locked, unlock
        if (now - lastSeen >= releaseMs || word !== locked) {
          locked = null;
        }
        lastSeen = now;
        return null;
      }

      // 3. Gesture is the same as candidate:
      lastSeen = now;

      // If still locked (user hasn't released), do not commit duplicate
      if (word === locked) {
        return null;
      }

      // Check if held long enough and cooldown has elapsed:
      if (now - since >= holdMs && now - lastCommit >= cooldownMs) {
        locked = word;
        lastCommit = now;
        return word;
      }

      return null;
    },

    isLocked: () => locked !== null && locked === candidate,

    holdProgress: (now) => {
      if (locked && locked === candidate) return 1;
      if (!candidate) return 0;
      return Math.min(1, Math.max(0, (now - since) / holdMs));
    },

    reset() {
      candidate = null;
      since = 0;
      lastSeen = 0;
      lastCommit = -Infinity;
      locked = null;
    },
  };
}
