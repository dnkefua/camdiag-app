import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDeMKB-ePfx5ojM3489WzsVTo8v1rh8muQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'camdiag-c7e78.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'camdiag-c7e78',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'camdiag-c7e78.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '781571839717',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:781571839717:web:3ba54c6911d1b2378a660c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-1NGH56H4GR',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;