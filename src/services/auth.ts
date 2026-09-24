import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  signInWithPopup,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { bindSensitiveSession, resetSensitiveSession } from './session';

export interface AppUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  initials: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin';
  createdAt: unknown;
  canUseClinicalTools: boolean;
  organizationId?: string;
  clinicalRole?: 'doctor' | 'nurse';
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
    role: 'patient',
    canUseClinicalTools: false,
    createdAt: override?.createdAt ?? serverTimestamp(),
    ...(photoUrl ? { photoUrl } : {}),
    about: override?.about ?? '',
    notificationPrefs: override?.notificationPrefs ?? {
      scanResults: true,
      medicationAlerts: true,
      productUpdates: false,
    },
  };
};

const saveUserProfile = async (profile: AppUser): Promise<void> => {
  try {
    const { id, uid, email, name, initials, createdAt, photoUrl, about, notificationPrefs } = profile;
    await setDoc(doc(db, 'users', profile.uid), {
      id, uid, email, name, initials, createdAt, about, notificationPrefs,
      ...(photoUrl ? { photoUrl } : {}),
    }, { merge: true });
  } catch {
    console.warn('[CamDiag] Profile could not be saved.');
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
  bindSensitiveSession(null);
  await signOut(auth);
};

export const getUserProfile = async (firebaseUser: User): Promise<AppUser> => {
  const docRef = doc(db, 'users', firebaseUser.uid);
  const fallbackProfile = createUserProfile(firebaseUser);
  // Roles stored in editable profile documents never confer authority.
  const token = await firebaseUser.getIdTokenResult();
  const role = token.claims.clinicalRole;
  const organizationId = token.claims.organizationId;
  const canUseClinicalTools = token.claims.verifiedClinician === true
    && (role === 'doctor' || role === 'nurse')
    && typeof organizationId === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(organizationId);
  const authority = {
    canUseClinicalTools,
    role: canUseClinicalTools ? role : 'patient',
    ...(canUseClinicalTools ? { clinicalRole: role, organizationId } : {}),
  } as Pick<AppUser, 'canUseClinicalTools' | 'role' | 'clinicalRole' | 'organizationId'>;

  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<AppUser>;
      return {
        ...fallbackProfile,
        name: typeof data.name === 'string' ? data.name.slice(0, 120) : fallbackProfile.name,
        initials: typeof data.initials === 'string' ? data.initials.slice(0, 4) : fallbackProfile.initials,
        about: typeof data.about === 'string' ? data.about.slice(0, 1000) : '',
        notificationPrefs: data.notificationPrefs ?? fallbackProfile.notificationPrefs,
        createdAt: data.createdAt ?? fallbackProfile.createdAt,
        ...authority,
      };
    }

    await saveUserProfile(fallbackProfile);
  } catch {
    console.warn('[CamDiag] Profile could not be loaded.');
  }

  return { ...fallbackProfile, ...authority };
};

export const onAuthChange = (callback: (user: AppUser | null) => void, onIdentityChange?: () => void) => {
  let generation = 0;
  let lastUid: string | null | undefined;
  let lastAuthority = '';
  const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
    const requestGeneration = ++generation;
    const uid = firebaseUser?.uid ?? null;
    if (uid !== lastUid) {
      bindSensitiveSession(uid);
      lastUid = uid;
      onIdentityChange?.();
    }
    if (firebaseUser) {
      void getUserProfile(firebaseUser).then((appUser) => {
        if (requestGeneration !== generation) return;
        const authority = `${appUser.canUseClinicalTools}:${appUser.organizationId ?? ''}:${appUser.clinicalRole ?? ''}`;
        if (lastAuthority && authority !== lastAuthority) resetSensitiveSession();
        lastAuthority = authority;
        callback(appUser);
      }).catch(() => {
        if (requestGeneration !== generation) return;
        resetSensitiveSession();
        callback(createUserProfile(firebaseUser));
      });
    } else {
      lastAuthority = '';
      callback(null);
    }
  });
  return () => { generation++; unsubscribe(); };
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
