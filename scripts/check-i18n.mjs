import fs from 'node:fs';

const code = fs.readFileSync('src/i18n.jsx', 'utf8');

// Extract DICT object
const enMatch = code.match(/en:\s*\{([\s\S]*?)\n\s*\},/);
const taMatch = code.match(/ta:\s*\{([\s\S]*?)\n\s*\},/);

function getKeys(block) {
  const keys = [];
  const lines = block.split('\n');
  for (const line of lines) {
    const kMatch = line.match(/^\s*([a-zA-Z0-9_]+):/);
    if (kMatch) keys.push(kMatch[1]);
  }
  return keys;
}

const enKeys = getKeys(enMatch[1]);
const taKeys = getKeys(taMatch[1]);

console.log('EN keys count:', enKeys.length);
console.log('TA keys count:', taKeys.length);

const missingInTa = enKeys.filter((k) => !taKeys.includes(k));
const missingInEn = taKeys.filter((k) => !enKeys.includes(k));

console.log('Missing in TA:', missingInTa);
console.log('Missing in EN:', missingInEn);

