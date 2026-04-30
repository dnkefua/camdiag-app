import { useState, createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
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
  loginWithPhone: (phoneNumber: string) => Promise<any>;
  confirmPhoneCode: (confirmationResult: unknown, code: string) => Promise<void>;
}

const throwOutsideProvider = () => { throw new Error('AuthContext used outside AuthProvider'); };

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => throwOutsideProvider(),
  register: async () => throwOutsideProvider(),
  logout: async () => throwOutsideProvider(),
  loginWithPhone: async () => { throwOutsideProvider(); return {} as any; },
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
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser as unknown as AppUser | null);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

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

  const handleConfirmPhoneCode = async (confirmationResult: unknown, code: string) => {
    const appUser = await firebaseConfirmPhoneCode(confirmationResult as any, code);
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
