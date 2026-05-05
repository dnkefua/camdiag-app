import { defineString } from 'firebase-functions/params';

export const GEMINI_MODEL = defineString('GEMINI_MODEL', { default: 'gemini-2.5-flash' });
export const GEMINI_LOCATION = defineString('GEMINI_LOCATION', { default: 'us-central1' });
export const CORS_ALLOWED_ORIGINS = defineString('CORS_ALLOWED_ORIGINS', {
  default: [
    'https://camdiag.app',
    'https://www.camdiag.app',
    'https://camdiag-app--camdiag-c7e78.europe-west4.hosted.app',
    'https://camdiag-c7e78.web.app',
    'https://camdiag-c7e78.firebaseapp.com',
    'https://ndnanalytics.com',
    'https://www.ndnanalytics.com',
    'http://localhost:5173',
  ].join(','),
});
export const APP_CHECK_ENFORCED = defineString('APP_CHECK_ENFORCED', { default: 'false' });

export const RATE_LIMIT = {
  ANALYZE: { windowMs: 60_000, max: 30 },
  SEARCH: { windowMs: 60_000, max: 60 },
  INTERACTIONS: { windowMs: 60_000, max: 60 },
} as const;

export const REQUEST_SIZE_LIMIT = '10mb';
