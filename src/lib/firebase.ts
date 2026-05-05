import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken, type AppCheck } from 'firebase/app-check';

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
export const auth = getAuth(app);
export const db = getFirestore(app);

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
  } catch (err) {
    console.error('[CamDiag] App Check token retrieval failed:', err);
    return null;
  }
};

let analyticsInstance: Analytics | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

export const getAnalyticsInstance = (): Promise<Analytics | null> => {
  if (analyticsInstance) return Promise.resolve(analyticsInstance);
  if (analyticsPromise) return analyticsPromise;
  analyticsPromise = isSupported().then((supported) => {
    if (!supported) return null;
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  }).catch((err) => {
    console.error('[CamDiag] Analytics initialization failed:', err);
    return null;
  });
  return analyticsPromise;
};

// Eagerly warm analytics for production (browser-only)
if (typeof window !== 'undefined') {
  initializeCamDiagAppCheck();
  void getAnalyticsInstance();
}

export default app;
