import { useState, createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import type { AppUser } from '../types';
import {
  loginWithEmail,
  registerWithEmail,
  logout as firebaseLogout,
  loginWithPhone as firebaseLoginWithPhone,
  confirmPhoneCode as firebaseConfirmPhoneCode,
  onAuthChange,
} from '../services/auth';

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  confirmPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
}

const throwOutsideProvider = () => { throw new Error('AuthContext used outside AuthProvider'); };
const E2E_TEST_USER_CREATED_AT = 0;

const shouldUseE2EAuthBypass = (): boolean => {
  if (!import.meta.env.DEV || import.meta.env.VITE_E2E_AUTH_BYPASS !== 'true') return false;
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('camdiag_e2e_auth') === 'true';
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => throwOutsideProvider(),
  register: async () => throwOutsideProvider(),
  logout: async () => throwOutsideProvider(),
  loginWithPhone: async () => { throwOutsideProvider(); return {} as ConfirmationResult; },
  confirmPhoneCode: async () => throwOutsideProvider(),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const e2eAuthBypass = shouldUseE2EAuthBypass();
  const testUser: AppUser = {
    id: 'e2e-user',
    uid: 'e2e-user',
    email: 'e2e@camdiag.test',
    name: 'E2E Clinician',
    initials: 'EC',
    role: 'doctor',
    createdAt: E2E_TEST_USER_CREATED_AT,
  };
  const [user, setUser] = useState<AppUser | null>(e2eAuthBypass ? testUser : null);
  const [isLoading, setIsLoading] = useState(!e2eAuthBypass);

  useEffect(() => {
    if (e2eAuthBypass) return undefined;
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser as unknown as AppUser | null);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [e2eAuthBypass]);

  const login = async (email: string, password: string) => {
    const appUser = await loginWithEmail(email, password);
    setUser(appUser as unknown as AppUser);
  };

  const register = async (email: string, password: string, name: string) => {
    const appUser = await registerWithEmail(email, password, name);
    setUser(appUser as unknown as AppUser);
  };

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
  };

  const handleLoginWithPhone = async (phoneNumber: string) => {
    return firebaseLoginWithPhone(phoneNumber);
  };

  const handleConfirmPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    const appUser = await firebaseConfirmPhoneCode(confirmationResult, code);
    setUser(appUser as unknown as AppUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        loginWithPhone: handleLoginWithPhone,
        confirmPhoneCode: handleConfirmPhoneCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
