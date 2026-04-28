/**
 * Centralized env validation. Surfaces a single source of truth for
 * "is feature X configured?" so components don't reach into import.meta.env
 * directly and risk drift.
 */

interface EnvFlags {
  ai: boolean;
  maps: boolean;
  firebaseAuth: boolean;
  analytics: boolean;
  sentry: boolean;
}

const present = (v: string | undefined): boolean =>
  Boolean(v) && v !== 'your_google_ai_api_key_here' && v !== 'your_google_maps_api_key_here' && !v?.startsWith('your_');

export const envFlags: EnvFlags = {
  ai: present(import.meta.env.VITE_GOOGLE_AI_API_KEY),
  maps: present(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
  firebaseAuth: present(import.meta.env.VITE_FIREBASE_API_KEY),
  analytics: present(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
  sentry: present(import.meta.env.VITE_SENTRY_DSN),
};

export const reportEnvWarnings = (): void => {
  if (!import.meta.env.DEV) return;
  const missing: string[] = [];
  if (!envFlags.ai) missing.push('VITE_GOOGLE_AI_API_KEY (MedGemma analysis disabled)');
  if (!envFlags.maps) missing.push('VITE_GOOGLE_MAPS_API_KEY (live facility map disabled)');
  if (!envFlags.firebaseAuth) missing.push('VITE_FIREBASE_API_KEY (auth disabled)');
  if (missing.length) {
    console.warn('[CamDiag] Missing env keys:\n  - ' + missing.join('\n  - '));
  }
};
