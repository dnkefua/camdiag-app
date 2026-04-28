import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, type User, type ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  loginWithEmail,
  registerWithEmail,
  logout as authLogout,
  getUserProfile,
  loginWithPhone,
  confirmPhoneCode as confirmCode,
  type AppUser,
} from '../services/auth';

export type { AppUser };

interface AuthContextValue {
  user: AppUser | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  confirmPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  loginWithPhone: async () => ({} as ConfirmationResult),
  confirmPhoneCode: async () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const appUser = await getUserProfile(fbUser);
          setUser(appUser);
          localStorage.setItem('camdiag_user', JSON.stringify(appUser));
        } catch {
          const name = fbUser.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'User';
          const initials = name.substring(0, 2).toUpperCase();
          setUser({ uid: fbUser.uid, email: fbUser.email || '', name, initials, role: 'patient', createdAt: null });
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
    const appUser = await loginWithEmail(email, password);
    setUser(appUser);
  };

  const register = async (email: string, password: string, name: string) => {
    const appUser = await registerWithEmail(email, password, name);
    setUser(appUser);
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
    localStorage.removeItem('camdiag_user');
  };

  const handleLoginWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
    return loginWithPhone(phoneNumber);
  };

  const handleConfirmPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    const appUser = await confirmCode(confirmationResult, code);
    setUser(appUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loginWithPhone: handleLoginWithPhone,
        confirmPhoneCode: handleConfirmPhoneCode,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};