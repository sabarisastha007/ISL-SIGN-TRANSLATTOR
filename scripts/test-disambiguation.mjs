import assert from 'node:assert/strict';
import {
  isValidPrediction,
  disambiguatePrediction,
  checkLGeometry,
  checkAGeometry,
  checkBGeometry,
  GEOMETRY_THRESHOLDS,
} from '../src/services/remoteRecognitionService.js';

console.log('Running focused test suite for AI Model Disambiguation & Landmark Geometry...\n');

// Helper to construct anatomically realistic 21-landmark array
function createHand({
  wrist = { x: 0.5, y: 0.7 },
  palmScale = 0.2,
  indexExt = false,
  indexUp = true,
  middleExt = false,
  ringExt = false,
  pinkyExt = false,
  thumbExt = false,
  thumbOut = true,
  thumbIndexLoop = false,
  isLeft = false,
} = {}) {
  const lm = Array.from({ length: 21 }, () => ({ x: wrist.x, y: wrist.y }));
  lm[0] = { ...wrist };

  const dir = isLeft ? -1 : 1;
  lm[5]  = { x: wrist.x + dir * 0.04, y: wrist.y - palmScale * 0.9 };  // Index MCP
  lm[9]  = { x: wrist.x + dir * 0.01, y: wrist.y - palmScale * 1.0 };  // Middle MCP
  lm[13] = { x: wrist.x - dir * 0.02, y: wrist.y - palmScale * 0.95 }; // Ring MCP
  lm[17] = { x: wrist.x - dir * 0.05, y: wrist.y - palmScale * 0.85 }; // Pinky MCP

  lm[1] = { x: wrist.x + dir * 0.03, y: wrist.y - palmScale * 0.3 };
  lm[2] = { x: wrist.x + dir * 0.06, y: wrist.y - palmScale * 0.5 };

  if (thumbIndexLoop) {
    lm[3] = { x: lm[5].x + dir * 0.02, y: lm[5].y - 0.03 };
    lm[4] = { x: lm[5].x, y: lm[5].y - 0.06 }; // touches index tip
  } else if (thumbExt && thumbOut) {
    lm[3] = { x: wrist.x + dir * (palmScale * 0.8), y: wrist.y - palmScale * 0.55 };
    lm[4] = { x: wrist.x + dir * (palmScale * 1.1), y: wrist.y - palmScale * 0.60 }; // thumb extended horizontally
  } else if (thumbExt && !thumbOut) {
    lm[3] = { x: wrist.x + dir * 0.04, y: wrist.y - palmScale * 0.8 };
    lm[4] = { x: wrist.x + dir * 0.03, y: wrist.y - palmScale * 1.1 }; // thumb straight up in fist
  } else {
    lm[3] = { x: wrist.x + dir * 0.02, y: wrist.y - palmScale * 0.6 };
    lm[4] = { x: wrist.x, y: wrist.y - palmScale * 0.65 };
  }

  const addFinger = (mcpIdx, pipIdx, dipIdx, tipIdx, isExt, pointsUp = true) => {
    const base = lm[mcpIdx];
    if (thumbIndexLoop && tipIdx === 8) {
      lm[pipIdx] = { x: base.x, y: base.y - 0.03 };
      lm[dipIdx] = { x: base.x, y: base.y - 0.05 };
      lm[tipIdx] = { x: lm[4].x, y: lm[4].y }; // touches thumb
    } else if (isExt) {
      const yDelta = pointsUp ? -1 : 1;
      lm[pipIdx] = { x: base.x, y: base.y + yDelta * palmScale * 0.4 };
      lm[dipIdx] = { x: base.x, y: base.y + yDelta * palmScale * 0.7 };
      lm[tipIdx] = { x: base.x, y: base.y + yDelta * palmScale * 1.0 };
    } else {
      lm[pipIdx] = { x: base.x, y: base.y - palmScale * 0.25 };
      lm[dipIdx] = { x: base.x + dir * 0.01, y: base.y - palmScale * 0.15 };
      lm[tipIdx] = { x: base.x + dir * 0.01, y: base.y - palmScale * 0.05 };
    }
  };

  addFinger(5, 6, 7, 8, indexExt, indexUp);
  addFinger(9, 10, 11, 12, middleExt, true);
  addFinger(13, 14, 15, 16, ringExt, true);
  addFinger(17, 18, 19, 20, pinkyExt, true);

  return lm;
}

// Test 1: isValidPrediction thresholds
{
  assert.equal(isValidPrediction({ word: 'A', confidence: 0.99 }), true);
  assert.equal(isValidPrediction({ word: 'A', confidence: 0.55 }), true);
  assert.equal(isValidPrediction({ word: 'A', confidence: 0.54 }), false);
  assert.equal(isValidPrediction({ word: '', confidence: 0.99 }), false);
  assert.equal(isValidPrediction({ word: null, confidence: 0.99 }), false);
  assert.equal(isValidPrediction(null), false);
  console.log('✔ Test 1 passed: isValidPrediction bounds and confidence threshold');
}

// Test 2: checkLGeometry (Valid, Mirrored, and Invalid cases)
{
  // 2A: Valid right hand L
  const lHandRight = createHand({ indexExt: true, thumbExt: true, thumbOut: true, isLeft: false });
  const resLRight = checkLGeometry(lHandRight, 1);
  assert.equal(resLRight.match, true, 'Right hand L-gesture must match');
  assert.ok(resLRight.confidence >= 0.90);

  // 2B: Valid left hand (or mirrored coordinate orientation) L
  const lHandLeft = createHand({ indexExt: true, thumbExt: true, thumbOut: true, isLeft: true });
  const resLLeft = checkLGeometry(lHandLeft, 1);
  assert.equal(resLLeft.match, true, 'Left / mirrored hand L-gesture must match');

  // 2C: Invalid: Two hands present
  const resL2Hands = checkLGeometry(lHandRight, 2);
  assert.equal(resL2Hands.match, false, 'L must not match when 2 hands are detected');

  // 2D: Invalid: Index finger pointing downward (Q-like shape)
  const lHandDown = createHand({ indexExt: true, indexUp: false, thumbExt: true, thumbOut: true });
  const resLDown = checkLGeometry(lHandDown, 1);
  assert.equal(resLDown.match, false, 'L must not match when index points downward');

  // 2E: Invalid: Index and middle both extended (V or U shape)
  const vHand = createHand({ indexExt: true, middleExt: true, thumbExt: true, thumbOut: true });
  const resV = checkLGeometry(vHand, 1);
  assert.equal(resV.match, false, 'L must not match when middle finger is also extended');

  // 2F: Invalid: Thumb curled into palm (D shape)
  const dHand = createHand({ indexExt: true, thumbExt: false, thumbOut: false });
  const resD = checkLGeometry(dHand, 1);
  assert.equal(resD.match, false, 'L must not match when thumb is curled');

  console.log('✔ Test 2 passed: checkLGeometry verified (valid, mirrored, invalid shapes, hand-count guard)');
}

// Test 3: checkAGeometry (ISL 2-hand closed fists apex)
{
  // 3A: Valid A: Two closed fists with thumbs touching at apex, wrists wider
  const h1 = createHand({ wrist: { x: 0.35, y: 0.7 }, thumbExt: true, thumbOut: false, isLeft: false });
  const h2 = createHand({ wrist: { x: 0.65, y: 0.7 }, thumbExt: true, thumbOut: false, isLeft: true });
  // Set thumb tips touching at apex
  h1[4] = { x: 0.49, y: 0.45 };
  h2[4] = { x: 0.51, y: 0.45 };

  const resA = checkAGeometry([h1, h2]);
  assert.equal(resA.match, true, 'Valid 2-hand ISL A must match');
  assert.ok(resA.confidence >= 0.90);

  // 3B: Invalid A: Only 1 hand present
  assert.equal(checkAGeometry([h1]).match, false, 'A must not match with only 1 hand');

  // 3C: Invalid A: Fingers extended (flat open hands)
  const hOpen1 = createHand({ indexExt: true, middleExt: true, ringExt: true, pinkyExt: true });
  const hOpen2 = createHand({ indexExt: true, middleExt: true, ringExt: true, pinkyExt: true });
  assert.equal(checkAGeometry([hOpen1, hOpen2]).match, false, 'A must not match when fingers are extended');

  // 3D: Invalid A: Thumbs too far apart across the screen
  const hFar1 = createHand({ wrist: { x: 0.2, y: 0.7 }, thumbExt: true, thumbOut: false });
  const hFar2 = createHand({ wrist: { x: 0.8, y: 0.7 }, thumbExt: true, thumbOut: false });
  hFar1[4] = { x: 0.25, y: 0.45 };
  hFar2[4] = { x: 0.75, y: 0.45 };
  assert.equal(checkAGeometry([hFar1, hFar2]).match, false, 'A must not match when thumb tips are far apart');

  // 3E: Invalid A: Wrists narrower than thumbs (inverted V, not tent arch)
  const hNarrowWrists1 = createHand({ wrist: { x: 0.49, y: 0.7 }, thumbExt: true });
  const hNarrowWrists2 = createHand({ wrist: { x: 0.51, y: 0.7 }, thumbExt: true });
  hNarrowWrists1[4] = { x: 0.45, y: 0.45 };
  hNarrowWrists2[4] = { x: 0.55, y: 0.45 };
  assert.equal(checkAGeometry([hNarrowWrists1, hNarrowWrists2]).match, false, 'A must not match if wrists are narrower than thumbs');

  console.log('✔ Test 3 passed: checkAGeometry verified (valid, 1-hand guard, open fingers, separated thumbs, wrist spread)');
}

// Test 4: checkBGeometry (ISL 2-hand dual thumb-index loops)
{
  // 4A: Valid B: Two hands with thumb-index loops close together
  const hb1 = createHand({ wrist: { x: 0.40, y: 0.7 }, thumbIndexLoop: true, isLeft: false });
  const hb2 = createHand({ wrist: { x: 0.60, y: 0.7 }, thumbIndexLoop: true, isLeft: true });
  // Bring loops close to each other
  hb1[8] = { x: 0.47, y: 0.50 };
  hb2[8] = { x: 0.53, y: 0.50 };

  const resB = checkBGeometry([hb1, hb2]);
  assert.equal(resB.match, true, 'Valid 2-hand ISL B must match');
  assert.ok(resB.confidence >= 0.90);

  // 4B: Invalid B: Only 1 hand present
  assert.equal(checkBGeometry([hb1]).match, false, 'B must not match with only 1 hand');

  // 4C: Invalid B: Loops not closed (open C-like handshapes)
  const hNoLoop1 = createHand({ indexExt: true, thumbExt: true, thumbIndexLoop: false });
  const hNoLoop2 = createHand({ indexExt: true, thumbExt: true, thumbIndexLoop: false });
  assert.equal(checkBGeometry([hNoLoop1, hNoLoop2]).match, false, 'B must not match when loops are open');

  // 4D: Invalid B: Loops formed but held far apart
  const hbFar1 = createHand({ wrist: { x: 0.20, y: 0.7 }, thumbIndexLoop: true });
  const hbFar2 = createHand({ wrist: { x: 0.80, y: 0.7 }, thumbIndexLoop: true });
  hbFar1[8] = { x: 0.25, y: 0.50 };
  hbFar2[8] = { x: 0.75, y: 0.50 };
  assert.equal(checkBGeometry([hbFar1, hbFar2]).match, false, 'B must not match when loops are far apart');

  console.log('✔ Test 4 passed: checkBGeometry verified (valid dual loops, 1-hand guard, open loop, separated loops)');
}

// Test 5: Full disambiguatePrediction integration, overrides, and safety guards
{
  const lHand = createHand({ indexExt: true, thumbExt: true, thumbOut: true });

  // 5A: CNN wrongly predicts V (0.75) for L due to room background -> overridden to L
  const fixedVtoL = disambiguatePrediction('V', 0.75, lHand, [lHand]);
  assert.equal(fixedVtoL.word, 'L');
  assert.equal(fixedVtoL.candidate, 'L');
  assert.ok(fixedVtoL.confidence >= 0.92);

  // 5B: CNN wrongly predicts U (0.60) for L -> overridden to L
  const fixedUtoL = disambiguatePrediction('U', 0.60, lHand, [lHand]);
  assert.equal(fixedUtoL.word, 'L');

  // 5C: CNN wrongly predicts N (0.65) for 2-hand A -> overridden to A
  const hA1 = createHand({ wrist: { x: 0.35, y: 0.7 }, thumbExt: true, thumbOut: false });
  const hA2 = createHand({ wrist: { x: 0.65, y: 0.7 }, thumbExt: true, thumbOut: false });
  hA1[4] = { x: 0.49, y: 0.45 };
  hA2[4] = { x: 0.51, y: 0.45 };
  const fixedNtoA = disambiguatePrediction('N', 0.65, hA1, [hA1, hA2]);
  assert.equal(fixedNtoA.word, 'A');
  assert.equal(fixedNtoA.candidate, 'A');

  // 5D: CNN wrongly predicts P (0.60) for 2-hand B -> overridden to B
  const hB1 = createHand({ wrist: { x: 0.40, y: 0.7 }, thumbIndexLoop: true, isLeft: false });
  const hB2 = createHand({ wrist: { x: 0.60, y: 0.7 }, thumbIndexLoop: true, isLeft: true });
  hB1[4] = { x: 0.47, y: 0.50 };
  hB1[8] = { x: 0.47, y: 0.50 };
  hB2[4] = { x: 0.53, y: 0.50 };
  hB2[8] = { x: 0.53, y: 0.50 };
  const fixedPtoB = disambiguatePrediction('P', 0.60, hB1, [hB1, hB2]);
  assert.equal(fixedPtoB.word, 'B');
  assert.equal(fixedPtoB.candidate, 'B');

  // 5E: Safety Guard: Missing / null / corrupted landmarks must return original prediction safely
  assert.equal(disambiguatePrediction('A', 0.80, null, []).word, 'A');
  assert.equal(disambiguatePrediction('B', 0.80, [], []).word, 'B');
  assert.equal(disambiguatePrediction('L', 0.80, [{ x: NaN, y: NaN }], []).word, 'L');

  // 5F: Safety Guard: High confidence non-A/B/L prediction on ambiguous handshape remains unchanged
  const openHand = createHand({ indexExt: true, middleExt: true, ringExt: true, pinkyExt: true });
  const preservedO = disambiguatePrediction('O', 0.95, openHand, [openHand]);
  assert.equal(preservedO.word, 'O', 'Unrelated high-confidence non-A/B/L sign must be preserved');

  // 5G: Existing rules: I vs U, W vs C, S vs Y, Z vs C remain intact
  const iHand = createHand({ pinkyExt: true, indexExt: false, middleExt: false });
  const fixedI = disambiguatePrediction('U', 0.65, iHand, [iHand]);
  assert.equal(fixedI.word, 'I', 'Existing I rule must work');

  const wHand = createHand({ indexExt: true, middleExt: true, ringExt: true, pinkyExt: false });
  const fixedW = disambiguatePrediction('C', 0.62, wHand, [wHand]);
  assert.equal(fixedW.word, 'W', 'Existing W rule must work');

  const yHand = createHand({ thumbExt: true, thumbOut: true, pinkyExt: true });
  const fixedY = disambiguatePrediction('S', 0.70, yHand, [yHand]);
  assert.equal(fixedY.word, 'Y', 'Existing Y rule must work');

  const sHand = createHand({ thumbExt: false, indexExt: false, middleExt: false, ringExt: false, pinkyExt: false });
  const fixedS = disambiguatePrediction('Y', 0.70, sHand, [sHand]);
  assert.equal(fixedS.word, 'S', 'Existing S rule must work');

  const zHand = createHand({ indexExt: true, middleExt: false, ringExt: false, pinkyExt: false, thumbExt: false, thumbOut: false });
  const fixedZ = disambiguatePrediction('C', 0.80, zHand, [zHand]);
  assert.equal(fixedZ.word, 'Z', 'Existing Z rule must work');

  console.log('✔ Test 5 passed: Full integration, CNN fallback overrides, missing landmark safety, and existing rule preservation verified');
}

console.log('\n=============================================');
console.log('✅ ALL GEOMETRY & DISAMBIGUATION TESTS PASSED');
console.log('=============================================\n');
