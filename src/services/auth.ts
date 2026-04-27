import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  initials: string;
  role: 'doctor' | 'nurse' | 'admin';
  createdAt: unknown;
}

export const loginWithEmail = async (email: string, password: string): Promise<AppUser> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return getUserProfile(credential.user);
};

export const registerWithEmail = async (email: string, password: string, name: string): Promise<AppUser> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const initials = name.substring(0, 2).toUpperCase();
  const appUser: AppUser = {
    uid: credential.user.uid,
    email,
    name,
    initials,
    role: 'doctor',
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', credential.user.uid), appUser);
  return appUser;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserProfile = async (firebaseUser: User): Promise<AppUser> => {
  const docRef = doc(db, 'users', firebaseUser.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as AppUser;
  }

  const name = firebaseUser.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'User';
  const initials = name.substring(0, 2).toUpperCase();
  const appUser: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name,
    initials,
    role: 'doctor',
    createdAt: serverTimestamp(),
  };
  await setDoc(docRef, appUser);
  return appUser;
};

export const onAuthChange = (callback: (user: AppUser | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const appUser = await getUserProfile(firebaseUser);
      callback(appUser);
    } else {
      callback(null);
    }
  });
};