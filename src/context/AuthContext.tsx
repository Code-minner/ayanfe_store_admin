"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiLogin, apiMe, type AdminUser } from "@/lib/api";

type AuthContextValue = {
  user: AdminUser | null;
  token: string | null;
  hydrated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "ayanfe-admin-token";
const USER_KEY = "ayanfe-admin-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const boot = async () => {
      try {
        const t = localStorage.getItem(TOKEN_KEY);
        const raw = localStorage.getItem(USER_KEY);
        if (raw) setUser(JSON.parse(raw) as AdminUser);
        if (t) {
          setToken(t);
          try {
            const { user: me } = await apiMe(t);
            if (me.role !== "admin") throw new Error("Not an admin");
            setUser(me);
          } catch {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        }
      } catch {
        /* ignore */
      }
      setHydrated(true);
    };
    void boot();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [token, user, hydrated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      hydrated,
      isAdmin: Boolean(user && token && user.role === "admin"),
      login: async (email, password) => {
        const data = await apiLogin(email, password);
        if (data.user.role !== "admin") {
          throw new Error("This account is not an admin");
        }
        setToken(data.token);
        setUser(data.user);
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [user, token, hydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
