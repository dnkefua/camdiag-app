import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
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
}

interface AuthContextValue {
  user: AppUser | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

const mapFirebaseUser = async (fbUser: User): Promise<AppUser> => {
  const docRef = doc(db, 'users', fbUser.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as AppUser;
  }

  const name = fbUser.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'User';
  const initials = name.substring(0, 2).toUpperCase();
  const appUser: AppUser = {
    uid: fbUser.uid,
    email: fbUser.email || '',
    name,
    initials,
    role: 'doctor',
  };
  await setDoc(docRef, { ...appUser, createdAt: serverTimestamp() });
  return appUser;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const appUser = await mapFirebaseUser(fbUser);
          setUser(appUser);
          localStorage.setItem('camdiag_user', JSON.stringify(appUser));
        } catch {
          const name = fbUser.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'User';
          const initials = name.substring(0, 2).toUpperCase();
          setUser({ uid: fbUser.uid, email: fbUser.email || '', name, initials, role: 'doctor' });
        }
      } else {
        setUser(null);
        localStorage.removeItem('camdiag_user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const appUser = await mapFirebaseUser(credential.user);
    setUser(appUser);
  };

  const register = async (email: string, password: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const initials = name.substring(0, 2).toUpperCase();
    const appUser: AppUser = { uid: credential.user.uid, email, name, initials, role: 'doctor' };
    await setDoc(doc(db, 'users', credential.user.uid), { ...appUser, createdAt: serverTimestamp() });
    setUser(appUser);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem('camdiag_user');
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isAuthenticated: !!user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};