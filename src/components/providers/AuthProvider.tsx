"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { clearAuthSession, getStoredAccessToken, getStoredUser } from "@/src/lib/api/client";
import type { User } from "@/src/lib/types";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isReady: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser() ?? null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken() ?? null);
  const [isReady] = useState(true);

  useEffect(() => {
    if (accessToken && user) {
      document.cookie = "lms_session=1; Path=/; SameSite=Lax";
    }
  }, [accessToken, user]);

  const login = useCallback((nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setAccessToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, accessToken, isReady, login, logout }),
    [user, accessToken, isReady, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
