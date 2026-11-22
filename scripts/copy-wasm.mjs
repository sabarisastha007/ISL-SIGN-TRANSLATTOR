// Copies the MediaPipe WASM runtime into public/ so it is served locally (matching the installed npm version).
import { cpSync, existsSync, mkdirSync } from 'node:fs';
const src = 'node_modules/@mediapipe/tasks-vision/wasm';
const dest = 'public/mediapipe/wasm';
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log('[isl] MediaPipe WASM copied to public/mediapipe/wasm');
} else {
  console.warn('[isl] MediaPipe WASM not found - run npm install first.');
}
