/**
 * Semi-Realistic 3D Avatar Loader & Factory
 * Connects the Text/Voice-to-Sign pipeline with the Semi-Realistic 3D Human Avatar Engine
 */
import { createSemiRealisticAvatar } from './semiRealisticAvatarEngine.js';

export function createAvatar(container, character = 'male') {
  return createSemiRealisticAvatar(container, character);
}

export { createSemiRealisticAvatar };
