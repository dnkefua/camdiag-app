export const ANALYTICS_KEY = 'camdiag_optional_analytics_v1';
export const PRIVACY_CHANGED_EVENT = 'camdiag:privacy-changed';
export const isAnalyticsPageAllowed = (): boolean => typeof window !== 'undefined'
  && ['/', '/demo'].includes(window.location.pathname)
  && window.location.search === '' && window.location.hash === '';
export const getAnalyticsConsent = (): boolean => {
  try { return typeof window !== 'undefined' && window.localStorage.getItem(ANALYTICS_KEY) === 'yes'; }
  catch { return false; }
};
export const setAnalyticsConsent = (enabled: boolean): void => {
  try {
    if (enabled) window.localStorage.setItem(ANALYTICS_KEY, 'yes');
    else window.localStorage.removeItem(ANALYTICS_KEY);
  } catch { /* Consent defaults to off when storage is restricted. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRIVACY_CHANGED_EVENT));
};
export const clearPrivacyPreferences = (): void => {
  setAnalyticsConsent(false);
  try { window.localStorage.removeItem('camdiag_medical_consent'); } catch { /* No-op. */ }
};
