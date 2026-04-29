import { useState, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { AppUser } from '../types';

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithPhone: (phoneNumber: string) => Promise<any>;
  confirmPhoneCode: (confirmationResult: any, code: string) => Promise<void>;
}

const throwOutsideProvider = () => { throw new Error('AuthContext used outside AuthProvider'); };

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: async () => throwOutsideProvider(),
  register: async () => throwOutsideProvider(),
  logout: async () => throwOutsideProvider(),
  loginWithPhone: async () => { return {} as any; },
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
   // Always provide a demo user for testing
   const demoUser: AppUser = {
     id: 'demo-user-123',
     uid: 'demo-user-123',
     email: 'demo@camdiag.cm',
     name: 'Demo User',
     initials: 'DU',
     role: 'patient',
     createdAt: Date.now()
   };

  const [user, setUser] = useState<AppUser | null>(demoUser);

   // Simplified auth functions that don't actually do anything
   const login = async (_email: string, _password: string) => {
     // Simulate login success
     setUser(demoUser);
   };

   const register = async (_email: string, _password: string, _name: string) => {
     // Simulate registration success
     setUser(demoUser);
   };

   const logout = async () => {
     // For demo purposes, just keep the demo user
     setUser(demoUser);
   };

   const handleLoginWithPhone = async (_phoneNumber: string): Promise<any> => {
     // Return a mock confirmation result
     return Promise.resolve({});
   };

   const handleConfirmPhoneCode = async (_confirmationResult: any, _code: string) => {
     // Simulate successful phone verification
     setUser(demoUser);
   };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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