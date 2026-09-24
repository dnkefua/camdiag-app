import { getAnalyticsInstance } from '../lib/firebase';
import { getAnalyticsConsent, isAnalyticsPageAllowed } from './privacy';

type EventParams = Record<string, string | number | boolean | undefined>;
const PUBLIC_EVENTS = new Set(['page_view', 'demo_started', 'demo_completed', 'demo_step', 'login_opened', 'signup_opened']);
const PUBLIC_PATHS = new Set(['/', '/demo']);

/** Strict allowlist: no health data, free text, identifiers, errors, or clinical routes. */
export const sanitizeAnalyticsEvent = (name: string, params: EventParams): EventParams | null => {
  if (!PUBLIC_EVENTS.has(name)) return null;
  if (name === 'page_view') return typeof params.path === 'string' && PUBLIC_PATHS.has(params.path) ? { page_path: params.path } : null;
  return typeof params.step === 'number' && Number.isInteger(params.step) && params.step >= 0 && params.step <= 10 ? { step: params.step } : {};
};

export const trackEvent = (name: string, params: EventParams = {}): void => {
  if (!getAnalyticsConsent() || !isAnalyticsPageAllowed()) return;
  const safeParams = sanitizeAnalyticsEvent(name, params);
  if (!safeParams) return;
  void getAnalyticsInstance().then(async (analytics) => {
    if (!analytics || !getAnalyticsConsent() || !isAnalyticsPageAllowed()) return;
    const { logEvent } = await import('firebase/analytics');
    if (!getAnalyticsConsent() || !isAnalyticsPageAllowed()) return;
    logEvent(analytics, name, { ...safeParams, page_location: `${window.location.origin}/`, page_referrer: '' });
  }).catch(() => { /* Optional analytics never interrupts clinical work. */ });
};
