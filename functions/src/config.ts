import { defineString } from 'firebase-functions/params';

export const GEMINI_API_KEY = defineString('GEMINI_API_KEY');
export const GEMINI_MODEL = defineString('GEMINI_MODEL', { default: 'gemini-2.0-flash' });

export const RATE_LIMIT = {
  ANALYZE: { windowMs: 60_000, max: 30 },
  SEARCH: { windowMs: 60_000, max: 60 },
  INTERACTIONS: { windowMs: 60_000, max: 60 },
} as const;

export const REQUEST_SIZE_LIMIT = '10mb';
