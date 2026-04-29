import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

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
  void getAnalyticsInstance();
}

export default app;
