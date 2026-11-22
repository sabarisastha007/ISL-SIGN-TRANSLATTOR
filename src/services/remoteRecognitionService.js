/* src/services/remoteRecognitionService.js */
/**
 * Simple wrapper around the Flask-less backend that serves the Keras image model.
 * All requests are proxied through Vite dev server (`/api`) so the frontend
 * code does not need to know about the actual host/port.
 */

const DEFAULT_TIMEOUT_MS = 5000; // 5 s per request

/** Helper to perform fetch with timeout and optional external signal */
function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(id);
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => {
        clearTimeout(id);
        controller.abort();
      }, { once: true });
    }
  }

  const opts = { ...options, signal: controller.signal };
  return fetch(url, opts).finally(() => clearTimeout(id));
}

export const GEOMETRY_THRESHOLDS = {
  // Finger extension / curl thresholds
  FINGER_EXT_RATIO_MIN: 1.15,
  FINGER_CURL_RATIO_MAX: 1.12,

  // L Gesture Thresholds (1 Hand)
  L_THUMB_INDEX_ANGLE_MIN_DEG: 45,
  L_THUMB_INDEX_ANGLE_MAX_DEG: 135,
  L_INDEX_UPWARD_MIN_DY: 0.02,
  L_THUMB_MIN_PALM_RATIO: 0.50,

  // A Gesture Thresholds (2 Hands, closed fists, thumbs touching/apex)
  A_MAX_THUMB_DISTANCE_RATIO: 0.95,
  A_WRIST_SPREAD_MIN_RATIO: 1.10,
  A_MAX_VERTICAL_OFFSET_RATIO: 1.0,

  // B Gesture Thresholds (2 Hands, thumb-index loops)
  B_LOOP_MAX_DISTANCE_RATIO: 0.40,
  B_DUAL_LOOP_MAX_DIST_RATIO: 1.60,
  B_MAX_VERTICAL_OFFSET_RATIO: 1.0,

  // High confidence guard
  CNN_HIGH_CONFIDENCE_THRESHOLD: 0.88,
};

function getDist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isValidHand(lm) {
  return Array.isArray(lm) && lm.length === 21 && lm.every((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
}

function getPalmSize(lm) {
  if (!isValidHand(lm)) return 0.1;
  const d = getDist(lm[0], lm[9]); // wrist to middle MCP
  return Math.max(0.02, d);
}

function isFingerExtended(lm, tipIdx, pipIdx) {
  const wrist = lm[0];
  const dTip = getDist(lm[tipIdx], wrist);
  const dPip = getDist(lm[pipIdx], wrist);
  return (dTip / Math.max(0.001, dPip)) > GEOMETRY_THRESHOLDS.FINGER_EXT_RATIO_MIN;
}

function isFingerCurled(lm, tipIdx, pipIdx) {
  const wrist = lm[0];
  const dTip = getDist(lm[tipIdx], wrist);
  const dPip = getDist(lm[pipIdx], wrist);
  return (dTip / Math.max(0.001, dPip)) <= GEOMETRY_THRESHOLDS.FINGER_CURL_RATIO_MAX;
}

/** Check L gesture geometry for exactly 1 hand */
export function checkLGeometry(lm, numHands) {
  if (numHands !== 1 || !isValidHand(lm)) return { match: false, confidence: 0, reason: null };

  const palmSize = getPalmSize(lm);

  // 1. Index finger extended
  if (!isFingerExtended(lm, 8, 6)) {
    return { match: false, confidence: 0, reason: 'Index not extended' };
  }

  // 2. Index finger pointing predominantly upward (y decreases upwards in video/landmark space)
  if (lm[8].y >= (lm[6].y - GEOMETRY_THRESHOLDS.L_INDEX_UPWARD_MIN_DY)) {
    return { match: false, confidence: 0, reason: 'Index not pointing upward' };
  }

  // 3. Middle, Ring, Pinky all curled into palm
  if (!isFingerCurled(lm, 12, 10) || !isFingerCurled(lm, 16, 14) || !isFingerCurled(lm, 20, 18)) {
    return { match: false, confidence: 0, reason: 'Fingers 12/16/20 not curled' };
  }

  // 4. Thumb vector vs Index vector angle (independent of left/right hand or mirror orientation)
  const vIndex = { x: lm[8].x - lm[5].x, y: lm[8].y - lm[5].y };
  const vThumb = { x: lm[4].x - lm[2].x, y: lm[4].y - lm[2].y };
  const magIndex = Math.hypot(vIndex.x, vIndex.y);
  const magThumb = Math.hypot(vThumb.x, vThumb.y);
  if (magIndex < 0.01 || magThumb < 0.01) {
    return { match: false, confidence: 0, reason: 'Degenerate vectors' };
  }

  const dot = vIndex.x * vThumb.x + vIndex.y * vThumb.y;
  const cosTheta = Math.max(-1, Math.min(1, dot / (magIndex * magThumb)));
  const angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;

  if (angleDeg < GEOMETRY_THRESHOLDS.L_THUMB_INDEX_ANGLE_MIN_DEG || angleDeg > GEOMETRY_THRESHOLDS.L_THUMB_INDEX_ANGLE_MAX_DEG) {
    return { match: false, confidence: 0, reason: `Thumb-index angle ${Math.round(angleDeg)}° out of range` };
  }

  // 5. Thumb tip spread away from index base
  const thumbSpread = getDist(lm[4], lm[5]) / palmSize;
  if (thumbSpread < GEOMETRY_THRESHOLDS.L_THUMB_MIN_PALM_RATIO) {
    return { match: false, confidence: 0, reason: `Thumb not spread outward (${thumbSpread.toFixed(2)})` };
  }

  const confidence = Math.min(0.98, Math.max(0.92, 0.95));
  return { match: true, confidence, reason: `L-shape (angle=${Math.round(angleDeg)}°, spread=${thumbSpread.toFixed(2)})` };
}

/** Check ISL A gesture geometry for 2 hands (closed fists, thumbs apex arch) */
export function checkAGeometry(allHands) {
  if (!allHands || allHands.length < 2) return { match: false, confidence: 0, reason: null };
  const [h1, h2] = allHands;
  if (!isValidHand(h1) || !isValidHand(h2)) return { match: false, confidence: 0, reason: null };

  const palmSize1 = getPalmSize(h1);
  const palmSize2 = getPalmSize(h2);
  const avgPalm = (palmSize1 + palmSize2) / 2;

  // 1. Both hands must have index, middle, ring, pinky curled into fists
  const h1Fist = isFingerCurled(h1, 8, 6) && isFingerCurled(h1, 12, 10) && isFingerCurled(h1, 16, 14) && isFingerCurled(h1, 20, 18);
  const h2Fist = isFingerCurled(h2, 8, 6) && isFingerCurled(h2, 12, 10) && isFingerCurled(h2, 16, 14) && isFingerCurled(h2, 20, 18);
  if (!h1Fist || !h2Fist) return { match: false, confidence: 0, reason: 'Both hands must be closed fists' };

  // Thumb and index must NOT form closed loops (touching thumb-index is B, not A)
  const h1LoopDist = getDist(h1[4], h1[8]) / palmSize1;
  const h2LoopDist = getDist(h2[4], h2[8]) / palmSize2;
  if (h1LoopDist < 0.35 || h2LoopDist < 0.35) {
    return { match: false, confidence: 0, reason: 'Thumb-index touching is B loop, not A fist' };
  }

  // 2. Thumbs must point upward relative to wrist
  if (h1[4].y >= h1[0].y || h2[4].y >= h2[0].y) {
    return { match: false, confidence: 0, reason: 'Thumbs must be elevated above wrists' };
  }

  // 3. Hands roughly at the same height
  const vertOffset = Math.abs(h1[0].y - h2[0].y) / avgPalm;
  if (vertOffset > GEOMETRY_THRESHOLDS.A_MAX_VERTICAL_OFFSET_RATIO) {
    return { match: false, confidence: 0, reason: 'Hands vertically misaligned' };
  }

  // 4. Two thumbs touching or close together at top
  const thumbDist = getDist(h1[4], h2[4]) / avgPalm;
  if (thumbDist > GEOMETRY_THRESHOLDS.A_MAX_THUMB_DISTANCE_RATIO) {
    return { match: false, confidence: 0, reason: `Thumb tips too far apart (${thumbDist.toFixed(2)})` };
  }

  // 5. Wrists spread wider than thumbs (tent / arch structure)
  const wristDist = getDist(h1[0], h2[0]);
  const thumbAbsDist = getDist(h1[4], h2[4]);
  if (wristDist < thumbAbsDist * GEOMETRY_THRESHOLDS.A_WRIST_SPREAD_MIN_RATIO) {
    return { match: false, confidence: 0, reason: 'Wrists must be wider than thumbs' };
  }

  const confidence = Math.min(0.98, Math.max(0.92, 0.96 - thumbDist * 0.05));
  return { match: true, confidence, reason: `2-hand ISL A (fists apex, thumbDist=${thumbDist.toFixed(2)})` };
}

/** Check ISL B gesture geometry for 2 hands (dual thumb-index loops) */
export function checkBGeometry(allHands) {
  if (!allHands || allHands.length < 2) return { match: false, confidence: 0, reason: null };
  const [h1, h2] = allHands;
  if (!isValidHand(h1) || !isValidHand(h2)) return { match: false, confidence: 0, reason: null };

  const palmSize1 = getPalmSize(h1);
  const palmSize2 = getPalmSize(h2);
  const avgPalm = (palmSize1 + palmSize2) / 2;

  // 1. On each hand, index tip (8) and thumb tip (4) must be touching or forming a loop
  const loop1Dist = getDist(h1[4], h1[8]) / palmSize1;
  const loop2Dist = getDist(h2[4], h2[8]) / palmSize2;
  if (loop1Dist > GEOMETRY_THRESHOLDS.B_LOOP_MAX_DISTANCE_RATIO || loop2Dist > GEOMETRY_THRESHOLDS.B_LOOP_MAX_DISTANCE_RATIO) {
    return { match: false, confidence: 0, reason: `Loops not closed (h1=${loop1Dist.toFixed(2)}, h2=${loop2Dist.toFixed(2)})` };
  }

  // 2. Remaining fingers not extended flat like an open palm
  const h1RemainingExtended = isFingerExtended(h1, 12, 10) && isFingerExtended(h1, 16, 14) && isFingerExtended(h1, 20, 18);
  const h2RemainingExtended = isFingerExtended(h2, 12, 10) && isFingerExtended(h2, 16, 14) && isFingerExtended(h2, 20, 18);
  if (h1RemainingExtended || h2RemainingExtended) {
    return { match: false, confidence: 0, reason: 'Fingers 12-20 must not be fully extended like open palm' };
  }

  // 3. Hands roughly at the same height
  const vertOffset = Math.abs(h1[0].y - h2[0].y) / avgPalm;
  if (vertOffset > GEOMETRY_THRESHOLDS.B_MAX_VERTICAL_OFFSET_RATIO) {
    return { match: false, confidence: 0, reason: 'Hands vertically misaligned' };
  }

  // 4. Loops held close together side-by-side
  const loopsDist = getDist(h1[8], h2[8]) / avgPalm;
  if (loopsDist > GEOMETRY_THRESHOLDS.B_DUAL_LOOP_MAX_DIST_RATIO) {
    return { match: false, confidence: 0, reason: `Dual loops too far apart (${loopsDist.toFixed(2)})` };
  }

  const confidence = Math.min(0.98, Math.max(0.92, 0.96 - ((loop1Dist + loop2Dist) / 2) * 0.1));
  return { match: true, confidence, reason: `2-hand ISL B (dual loops, loop1=${loop1Dist.toFixed(2)}, loop2=${loop2Dist.toFixed(2)})` };
}

/**
 * Disambiguate predictions using MediaPipe hand landmarks.
 * Prioritizes authoritative landmark geometry for structurally unambiguous signs (A, B, L)
 * to guard against CNN domain shift, while preserving CNN predictions for other signs.
 */
export function disambiguatePrediction(word, confidence, landmarks, allLandmarks = []) {
  if (!word || !isValidHand(landmarks)) {
    return { word, confidence, rule: null, candidate: null, candidateConfidence: 0 };
  }

  const allHands = allLandmarks && allLandmarks.length > 0 ? allLandmarks : [landmarks];
  const numHands = allHands.length;

  // 1. Authoritative check for L (1 hand)
  const lGeom = checkLGeometry(landmarks, numHands);
  if (lGeom.match) {
    // If CNN is not overwhelmingly confident (>0.88) on an unrelated non-confused letter, confirm L
    const isConfusedClass = ['L', 'V', 'U', 'C', 'D', 'G', 'I'].includes(word);
    if (isConfusedClass || confidence < GEOMETRY_THRESHOLDS.CNN_HIGH_CONFIDENCE_THRESHOLD) {
      return {
        word: 'L',
        confidence: Math.max(confidence, lGeom.confidence),
        rule: lGeom.reason,
        candidate: 'L',
        candidateConfidence: lGeom.confidence,
      };
    }
  }

  // 2. Authoritative check for A (2 hands)
  const aGeom = checkAGeometry(allHands);
  if (aGeom.match) {
    return {
      word: 'A',
      confidence: Math.max(confidence, aGeom.confidence),
      rule: aGeom.reason,
      candidate: 'A',
      candidateConfidence: aGeom.confidence,
    };
  }

  // 3. Authoritative check for B (2 hands)
  const bGeom = checkBGeometry(allHands);
  if (bGeom.match) {
    return {
      word: 'B',
      confidence: Math.max(confidence, bGeom.confidence),
      rule: bGeom.reason,
      candidate: 'B',
      candidateConfidence: bGeom.confidence,
    };
  }

  // 4. Fall through to existing disambiguation rules for other letters
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const wrist = landmarks[0];

  const ratios = [[8, 6], [12, 10], [16, 14], [20, 18]].map(
    ([tip, pip]) => dist(landmarks[tip], wrist) / Math.max(0.001, dist(landmarks[pip], wrist))
  );
  const isExtended = ratios.map((r) => r > GEOMETRY_THRESHOLDS.FINGER_EXT_RATIO_MIN);
  const [indexExt, middleExt, ringExt, pinkyExt] = isExtended;

  const thumbExt = dist(landmarks[4], landmarks[17]) / Math.max(0.001, dist(landmarks[3], landmarks[17])) > 1.1;

  // Case 1: 'I' vs 'V' / 'U'
  if ((word === 'V' || word === 'U' || word === 'I') && pinkyExt && !indexExt && !middleExt) {
    return { word: 'I', confidence: Math.max(confidence, 0.90), rule: 'Pinky isolated (I)', candidate: 'I', candidateConfidence: 0.90 };
  }
  if (word === 'I' && indexExt && middleExt && !pinkyExt) {
    return { word: 'U', confidence: Math.max(confidence, 0.88), rule: 'Index+Middle up (U)', candidate: 'U', candidateConfidence: 0.88 };
  }

  // Case 2: 'W' vs 'C' / 'T'
  if ((word === 'W' || word === 'C' || word === 'T') && indexExt && middleExt && ringExt && !pinkyExt) {
    return { word: 'W', confidence: Math.max(confidence, 0.90), rule: '3 fingers up (W)', candidate: 'W', candidateConfidence: 0.90 };
  }

  // Case 3: 'S' vs 'Y'
  if (word === 'S' || word === 'Y') {
    if (pinkyExt && thumbExt && !indexExt && !middleExt && !ringExt) {
      return { word: 'Y', confidence: Math.max(confidence, 0.90), rule: 'Thumb+Pinky (Y)', candidate: 'Y', candidateConfidence: 0.90 };
    }
    if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
      return { word: 'S', confidence: Math.max(confidence, 0.90), rule: 'Closed fist (S)', candidate: 'S', candidateConfidence: 0.90 };
    }
  }

  // Case 4: 'Z' vs 'C'
  if ((word === 'C' || word === 'Z') && indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { word: 'Z', confidence: Math.max(confidence, 0.88), rule: 'Single index forward (Z)', candidate: 'Z', candidateConfidence: 0.88 };
  }

  // Case 5: 'Q' vs 'T'
  if (word === 'T' || word === 'Q') {
    const indexPointingDown = landmarks[8].y > landmarks[5].y + 0.04;
    if (indexPointingDown && !middleExt && !ringExt && !pinkyExt) {
      return { word: 'Q', confidence: Math.max(confidence, 0.88), rule: 'Index down (Q)', candidate: 'Q', candidateConfidence: 0.88 };
    }
  }

  return { word, confidence, rule: null, candidate: null, candidateConfidence: 0 };
}

/** Validate prediction structure and confidence threshold */
export function isValidPrediction(data, minConfidence = 0.55) {
  if (!data || typeof data.word !== 'string' || !data.word.trim()) return false;
  const conf = data.confidence;
  return Number.isFinite(conf) && conf >= minConfidence && conf <= 1;
}

/** Check backend health endpoint */
export async function checkHealth(options = {}) {
  const resp = await fetchWithTimeout('/api/health', options);
  if (!resp.ok) throw new Error(`Health check failed: ${resp.status}`);
  const data = await resp.json();
  if (!data.model_input_shape || !data.model_output_shape) {
    throw new Error('Malformed health response');
  }
  return data;
}

/**
 * Send a base64‑encoded image (PNG/JPEG) to the backend and get a prediction.
 * Returns an object { word: string, confidence: number }.
 */
export async function predictImage(base64Image, options = {}) {
  const payload = JSON.stringify({ image: base64Image });
  const resp = await fetchWithTimeout('/api/predict', {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: payload,
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Prediction error ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  if (!data.word) throw new Error('Backend returned no word');
  return data;
}
