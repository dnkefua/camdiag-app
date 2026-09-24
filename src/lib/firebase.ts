import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken, type AppCheck } from 'firebase/app-check';
import { getAnalyticsConsent, isAnalyticsPageAllowed, PRIVACY_CHANGED_EVENT, ANALYTICS_KEY } from '../services/privacy';

const required = (key: string) => {
  const value = import.meta.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
};

const getFirebaseConfig = (): Record<string, string> => {
  try {
    return {
      apiKey: required('VITE_FIREBASE_API_KEY'),
      authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: required('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: required('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: required('VITE_FIREBASE_APP_ID'),
      measurementId: required('VITE_FIREBASE_MEASUREMENT_ID'),
    };
  } catch (e) {
    console.error('[CamDiag] Firebase config missing:', e);
    throw e;
  }
};

const firebaseConfig = getFirebaseConfig();

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: browserSessionPersistence, popupRedirectResolver: browserPopupRedirectResolver });
export const db = getFirestore(app);
export const storage = getStorage(app);

let appCheckInstance: AppCheck | null = null;

export const initializeCamDiagAppCheck = (): AppCheck | null => {
  if (appCheckInstance) return appCheckInstance;
  if (typeof window === 'undefined') return null;

  const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey) {
    console.warn('[CamDiag] App Check site key missing; App Check token refresh is disabled.');
    return null;
  }

  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return appCheckInstance;
};

export const getAppCheckToken = async (): Promise<string | null> => {
  const appCheck = initializeCamDiagAppCheck();
  if (!appCheck) return null;

  try {
    const token = await getToken(appCheck, false);
    return token.token;
  } catch {
    return null;
  }
};

let analyticsInstance: Analytics | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

export const getAnalyticsInstance = (): Promise<Analytics | null> => {
  if (!getAnalyticsConsent() || !isAnalyticsPageAllowed()) return Promise.resolve(null);
  if (analyticsInstance) return Promise.resolve(analyticsInstance);
  if (analyticsPromise) return analyticsPromise;
  analyticsPromise = import('firebase/analytics').then(async ({ isSupported, initializeAnalytics, setAnalyticsCollectionEnabled }) => {
    if (!await isSupported() || !getAnalyticsConsent() || !isAnalyticsPageAllowed()) return null;
    // Disable automatic page views: clinical routes and URLs must not enter analytics.
    analyticsInstance = initializeAnalytics(app, { config: { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false } });
    setAnalyticsCollectionEnabled(analyticsInstance, true);
    return analyticsInstance;
  }).catch(() => {
    return null;
  }).then((instance) => {
    if (!instance) analyticsPromise = null;
    return instance;
  });
  return analyticsPromise;
};

if (typeof window !== 'undefined') {
  const syncAnalyticsCollection = () => {
    if (analyticsInstance) {
      void import('firebase/analytics').then(({ setAnalyticsCollectionEnabled }) => {
        if (analyticsInstance) setAnalyticsCollectionEnabled(analyticsInstance, getAnalyticsConsent() && isAnalyticsPageAllowed());
      });
    }
  };
  window.addEventListener(PRIVACY_CHANGED_EVENT, syncAnalyticsCollection);
  window.addEventListener('storage', (event) => {
    if (event.key === ANALYTICS_KEY || event.key === null) syncAnalyticsCollection();
  });
}

export default app;
