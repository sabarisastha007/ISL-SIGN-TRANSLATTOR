import assert from 'node:assert/strict';
import { createStabilizer } from '../src/services/signRecognitionService.js';

console.log('Running focused tests for createStabilizer...');

// Test 1: Basic hold and commit
{
  const stab = createStabilizer({ holdMs: 600, cooldownMs: 500, jitterToleranceMs: 150, releaseMs: 200 });
  
  assert.equal(stab.update('HELLO', 0), null, 'Initial frame should not commit');
  assert.equal(stab.isLocked(), false);
  assert.ok(stab.holdProgress(300) > 0.4 && stab.holdProgress(300) < 0.6, 'Progress should be ~0.5 at halfway');

  assert.equal(stab.update('HELLO', 300), null, 'Halfway frame should not commit');
  assert.equal(stab.update('HELLO', 599), null, 'Just before holdMs should not commit');
  
  const committed = stab.update('HELLO', 600);
  assert.equal(committed, 'HELLO', 'Should commit when holdMs reached');
  assert.equal(stab.isLocked(), true, 'Should be locked after commit');
  assert.equal(stab.holdProgress(600), 1, 'Progress should be 1 after commit');
  console.log('✔ Test 1 passed: Basic hold and commit');
}

// Test 2: Continuous hold duplicate suppression
{
  const stab = createStabilizer({ holdMs: 600, cooldownMs: 500 });
  stab.update('A', 0);
  assert.equal(stab.update('A', 600), 'A');
  
  // Continuously held for another 2 seconds
  for (let t = 650; t <= 2600; t += 50) {
    assert.equal(stab.update('A', t), null, `Should not emit duplicate while continuously held at t=${t}`);
    assert.equal(stab.isLocked(), true);
  }
  console.log('✔ Test 2 passed: Continuous hold duplicate suppression');
}

// Test 3: Jitter tolerance (single-frame drop / noise)
{
  const stab = createStabilizer({ holdMs: 600, cooldownMs: 500, jitterToleranceMs: 150 });
  stab.update('WATER', 0);
  stab.update('WATER', 250);
  
  // Momentary single-frame drop (null for 66ms)
  assert.equal(stab.update(null, 316), null);
  
  // Resumes next frame (still within 150ms jitter tolerance)
  stab.update('WATER', 382);
  assert.ok(stab.holdProgress(382) > 0.5, 'Hold progress should be preserved across brief jitter');
  
  // Hold reaches 600ms
  assert.equal(stab.update('WATER', 600), 'WATER', 'Should commit despite brief drop');
  console.log('✔ Test 3 passed: Jitter tolerance preserves hold progress');
}

// Test 4: Repeated-letter handling with intentional release
{
  const stab = createStabilizer({ holdMs: 600, cooldownMs: 500, releaseMs: 200 });
  
  // First 'L'
  stab.update('L', 0);
  assert.equal(stab.update('L', 600), 'L', 'First L should commit');
  
  // User releases sign for 250ms (> releaseMs)
  stab.update(null, 700);
  stab.update(null, 950);
  
  // User shows 'L' again after cooldown (t=1150 > 600 + 500)
  assert.equal(stab.update('L', 1150), null, 'Second L begins holding');
  assert.equal(stab.update('L', 1450), null);
  assert.equal(stab.update('L', 1750), 'L', 'Second L commits successfully for repeated letters');
  console.log('✔ Test 4 passed: Repeated-letter handling with intentional release');
}

// Test 5: Switching to a different sign
{
  const stab = createStabilizer({ holdMs: 600, cooldownMs: 500 });
  
  stab.update('YES', 0);
  assert.equal(stab.update('YES', 600), 'YES');
  
  // Switch immediately to NO
  stab.update('NO', 700);
  assert.equal(stab.holdProgress(700), 0, 'New sign starts with 0 progress');
  
  // Hold NO past cooldown (600 + 500 = 1100) and hold duration (700 + 600 = 1300)
  assert.equal(stab.update('NO', 1000), null);
  assert.equal(stab.update('NO', 1300), 'NO', 'Different sign commits after its hold duration');
  console.log('✔ Test 5 passed: Switching between different signs');
}

// Test 6: Reset clears internal state
{
  const stab = createStabilizer({ holdMs: 600 });
  stab.update('HELP', 0);
  stab.update('HELP', 400);
  assert.ok(stab.holdProgress(400) > 0);
  
  stab.reset();
  assert.equal(stab.holdProgress(400), 0);
  assert.equal(stab.isLocked(), false);
  console.log('✔ Test 6 passed: Reset clears state');
}

console.log('\nAll 6 focused stabilization tests passed successfully! 🎉');

