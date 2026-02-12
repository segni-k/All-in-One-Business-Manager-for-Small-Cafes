"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Permission } from "./types";
import { auth as authApi, setToken, removeToken, getApiUrl } from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
  hasAnyPermission: (...perms: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token && getApiUrl()) {
      authApi
        .me()
        .then((res) => {
          setUser(res.user ?? (res as unknown as User));
        })
        .catch(() => {
          removeToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.token);
    setUser(res.user);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getApiUrl()) return;
    const res = await authApi.me();
    setUser(res.user ?? (res as unknown as User));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      removeToken();
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (perm: Permission) => {
      if (!user) return false;

      // Admin has all permissions
      if (user.role.name === "admin") return true;

      // Check backend permissions array
      return user.role.permissions.some((p) => p.name === perm);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (...perms: Permission[]) => perms.some((p) => hasPermission(p)),
    [hasPermission]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
