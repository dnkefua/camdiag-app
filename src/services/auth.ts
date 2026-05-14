import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  signInWithPopup,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface AppUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  initials: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin';
  createdAt: unknown;
  photoUrl?: string;
  about?: string;
  symptoms?: string;
  notificationPrefs?: {
    scanResults: boolean;
    medicationAlerts: boolean;
    productUpdates: boolean;
  };
}

const getDisplayName = (firebaseUser: User): string => (
  firebaseUser.displayName?.trim()
  || firebaseUser.email?.split('@')[0]?.replace(/[._]/g, ' ')
  || firebaseUser.phoneNumber
  || 'User'
);

const createUserProfile = (firebaseUser: User, override?: Partial<AppUser>): AppUser => {
  const name = override?.name || getDisplayName(firebaseUser);
  const photoUrl = override?.photoUrl ?? firebaseUser.photoURL ?? undefined;
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: override?.email ?? firebaseUser.email ?? '',
    name,
    initials: override?.initials ?? name.substring(0, 2).toUpperCase(),
    role: override?.role ?? 'patient',
    createdAt: override?.createdAt ?? serverTimestamp(),
    ...(photoUrl ? { photoUrl } : {}),
    about: override?.about ?? '',
    symptoms: override?.symptoms ?? '',
    notificationPrefs: override?.notificationPrefs ?? {
      scanResults: true,
      medicationAlerts: true,
      productUpdates: false,
    },
  };
};

const saveUserProfile = async (profile: AppUser): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
  } catch (err) {
    console.error('[CamDiag] Failed to save user profile:', err);
  }
};

export const loginWithEmail = async (email: string, password: string): Promise<AppUser> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return getUserProfile(credential.user);
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = async (): Promise<AppUser> => {
  const credential = await signInWithPopup(auth, googleProvider);
  return getUserProfile(credential.user);
};

export const registerWithEmail = async (email: string, password: string, name: string): Promise<AppUser> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const appUser = createUserProfile(credential.user, {
    email,
    name,
    initials: name.substring(0, 2).toUpperCase(),
  });
  await saveUserProfile(appUser);
  return appUser;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserProfile = async (firebaseUser: User): Promise<AppUser> => {
  const docRef = doc(db, 'users', firebaseUser.uid);
  const fallbackProfile = createUserProfile(firebaseUser);

  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<AppUser>;
      return {
        ...fallbackProfile,
        ...data,
        id: data.id || firebaseUser.uid,
        uid: data.uid || firebaseUser.uid,
      };
    }

    await saveUserProfile(fallbackProfile);
  } catch (err) {
    console.error('[CamDiag] Failed to load user profile:', err);
  }

  return fallbackProfile;
};

export const onAuthChange = (callback: (user: AppUser | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const appUser = await getUserProfile(firebaseUser);
        callback(appUser);
      } catch (err) {
        console.error('[CamDiag] Auth profile fallback failed:', err);
        callback(createUserProfile(firebaseUser));
      }
    } else {
      callback(null);
    }
  });
};

let recaptchaVerifier: RecaptchaVerifier | null = null;

export const getRecaptchaVerifier = (): RecaptchaVerifier => {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    });
  }
  return recaptchaVerifier;
};

export const loginWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
  const verifier = getRecaptchaVerifier();
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export const confirmPhoneCode = async (confirmationResult: ConfirmationResult, code: string): Promise<AppUser> => {
  const credential = await confirmationResult.confirm(code);
  return getUserProfile(credential.user);
};

export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};
