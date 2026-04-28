import { logEvent, type Analytics } from 'firebase/analytics';
import { getAnalyticsInstance } from '../lib/firebase';

type EventParams = Record<string, string | number | boolean | undefined>;

let cached: Analytics | null = null;

const getInstance = async (): Promise<Analytics | null> => {
  if (cached) return cached;
  cached = await getAnalyticsInstance();
  return cached;
};

/**
 * Fire-and-forget analytics event. Safe in SSR / unsupported browsers
 * (returns silently). Console-logs in dev for verification.
 */
export const trackEvent = (name: string, params: EventParams = {}): void => {
  if (import.meta.env.DEV) {
    console.info('[analytics]', name, params);
  }
  getInstance().then((analytics) => {
    if (analytics) logEvent(analytics, name, params);
  }).catch((err) => {
    console.error('[CamDiag] Analytics track failed:', err);
  });
};
