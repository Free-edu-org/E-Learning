import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  login: (user: User, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (nextUser: User, nextToken?: string) => {
    setUser(nextUser);
    setToken(nextToken ?? null);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      token,
      login,
      logout
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
