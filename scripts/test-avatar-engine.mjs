import assert from 'node:assert/strict';
import { ISL_SIGNS, ISL_CATEGORIES, getSignData, isSignSupported, REST_POSE } from '../src/data/islSignDatabase.js';
import { textToSigns, hasAnimation, glossToTamil } from '../src/services/signMappingService.js';

console.log('Running focused test suite for ISL Cartoon Avatar Engine & Sign Database...\n');

// Test 1: Category & Database Schema Verification
{
  assert.ok(ISL_CATEGORIES.length >= 5, 'Should have at least 5 sign categories');
  assert.ok(ISL_CATEGORIES.includes('Greetings'), 'Greetings category must exist');
  assert.ok(ISL_CATEGORIES.includes('Needs & Daily Living'), 'Needs & Daily Living category must exist');

  const signKeys = Object.keys(ISL_SIGNS);
  assert.ok(signKeys.length >= 16, `Expected at least 16 verified signs, found ${signKeys.length}`);

  signKeys.forEach((key) => {
    const s = ISL_SIGNS[key];
    assert.equal(s.language, 'ISL', `${key}: Language must be ISL`);
    assert.ok(s.word, `${key}: Must have a word identifier`);
    assert.ok(s.gloss, `${key}: Must have a gloss representation`);
    assert.ok(s.category, `${key}: Must belong to a category`);
    assert.ok(s.description, `${key}: Must have a linguistic description`);
    assert.ok(s.handConfiguration?.dominant, `${key}: Must have dominant hand configuration`);
    assert.ok(s.source, `${key}: Must cite an authoritative source`);
    assert.ok(['verified', 'provisional'].includes(s.verificationStatus), `${key}: Status must be verified or provisional`);
    assert.ok(Array.isArray(s.keyframes) && s.keyframes.length > 0, `${key}: Keyframes must be non-empty`);

    // Verify keyframes conform to joint specification
    s.keyframes.forEach((kf, idx) => {
      if (kf.r) {
        assert.ok(Array.isArray(kf.r), `${key} kf #${idx}: Right arm joint array`);
        assert.ok(kf.r.length <= 14, `${key} kf #${idx}: Right arm max 14 values`);
      }
      if (kf.l) {
        assert.ok(Array.isArray(kf.l), `${key} kf #${idx}: Left arm joint array`);
        assert.ok(kf.l.length <= 14, `${key} kf #${idx}: Left arm max 14 values`);
      }
      if (kf.h) {
        assert.ok(Array.isArray(kf.h) && kf.h.length === 3, `${key} kf #${idx}: Head nod/turn/tilt`);
      }
      if (kf.f) {
        assert.ok(Array.isArray(kf.f) && kf.f.length === 3, `${key} kf #${idx}: Face smile/eyebrow/mouth`);
      }
    });
  });

  console.log(`✔ Test 1 passed: All ${signKeys.length} ISL signs conform to Phase 6 schema with verified sources`);
}

// Test 2: Core Vocabulary Lookup & Support
{
  const expectedSigns = [
    'HELLO', 'HELP', 'THANK YOU', 'SORRY', 'YES', 'NO',
    'WATER', 'FOOD', 'PLEASE', 'EMERGENCY', 'I', 'YOU',
    'MY', 'NAME', 'NEED', 'IS',
  ];

  expectedSigns.forEach((word) => {
    assert.ok(isSignSupported(word), `Word ${word} should be supported`);
    const data = getSignData(word);
    assert.ok(data !== null, `getSignData(${word}) should not be null`);
    assert.equal(data.verificationStatus, 'verified', `${word} must be verified ISL sign`);
  });

  // Unsupported word test
  assert.equal(isSignSupported('XYLOPHONE'), false, 'Non-vocabulary word should not be supported');
  assert.equal(getSignData('XYLOPHONE'), null);

  console.log('✔ Test 2 passed: Core 16 ISL words verified and supported');
}

// Test 3: Text to Signs Conversion (Single & Multi-word)
{
  // Single word
  const single = textToSigns('HELLO');
  assert.equal(single.length, 1);
  assert.equal(single[0].word, 'HELLO');
  assert.equal(single[0].status, 'ok');

  // Multi-word sequence with stop words
  const multi = textToSigns('HELLO I NEED WATER');
  assert.equal(multi.length, 4);
  assert.deepEqual(multi.map((m) => m.word), ['HELLO', 'I', 'NEED', 'WATER']);
  assert.ok(multi.every((m) => m.status === 'ok'));

  // Sentence with unsupported word
  const mixed = textToSigns('PLEASE HELP ELEPHANT');
  assert.equal(mixed.length, 3);
  assert.equal(mixed[0].word, 'PLEASE');
  assert.equal(mixed[0].status, 'ok');
  assert.equal(mixed[1].word, 'HELP');
  assert.equal(mixed[1].status, 'ok');
  assert.equal(mixed[2].word, 'ELEPHANT');
  assert.equal(mixed[2].status, 'unsupported');

  console.log('✔ Test 3 passed: Text-to-signs conversion with multi-word sequences and unsupported detection');
}

// Test 4: Bilingual Gloss Translation
{
  assert.equal(glossToTamil('HELLO'), 'வணக்கம்');
  assert.equal(glossToTamil('WATER'), 'தண்ணீர்');
  assert.equal(glossToTamil('HELP'), 'உதவி');
  console.log('✔ Test 4 passed: Word-by-word Tamil gloss mapping');
}

// Test 5: Rest Pose Dimensions & Consistency
{
  assert.equal(REST_POSE.length, 34, 'REST_POSE must contain exactly 34 joint & expression channels');
  // Right Arm (0-13), Left Arm (14-27), Head (28-30), Face (31-33)
  assert.ok(REST_POSE[8] < 0.3, 'Rest pose fingers should be relaxed');
  assert.ok(REST_POSE[22] < 0.3, 'Rest pose left fingers should be relaxed');
  console.log('✔ Test 5 passed: 34-channel articulated skeletal rest pose confirmed');
}

// Test 6: ISL Manual Alphabet & Fingerspelling Deconstruction
{
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  alphabet.forEach((letter) => {
    assert.ok(isSignSupported(letter), `Letter ${letter} must be supported`);
    const data = getSignData(letter);
    assert.ok(data.category === 'Alphabet / Fingerspelling' || data.category === 'Pronouns');
    assert.equal(data.verificationStatus, 'verified');
    assert.ok(data.keyframes.length >= 2, `${letter} must have presentation keyframes`);
  });

  const spelled = textToSigns('NAME RAHUL', { fingerspell: true });
  assert.equal(spelled[0].word, 'NAME');
  assert.equal(spelled[0].status, 'ok');
  assert.equal(spelled.length, 6); // NAME + R + A + H + U + L
  assert.deepEqual(spelled.slice(1).map((s) => s.word), ['R', 'A', 'H', 'U', 'L']);
  assert.ok(spelled.slice(1).every((s) => s.isFingerspelled && s.parentWord === 'RAHUL'));
  console.log('✔ Test 6 passed: All 26 ISL manual alphabet signs verified & fingerspelling decomposes words');
}

console.log('\nAll Avatar Engine and ISL Sign Database tests passed successfully! 🎉\n');

