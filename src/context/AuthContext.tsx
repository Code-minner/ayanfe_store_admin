"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiLogin,
  apiMe,
  apiUpdateProfile,
  apiUploadAvatar,
  type AdminUser,
} from "@/lib/api";
import {
  can,
  homePathForRole,
  isStaffRole,
  type StaffPermission,
  type StaffRole,
} from "@/lib/roles";

type AuthContextValue = {
  user: AdminUser | null;
  token: string | null;
  hydrated: boolean;
  /** Any back-office role (support, admin, super_admin). */
  isStaff: boolean;
  role: StaffRole | null;
  can: (permission: StaffPermission) => boolean;
  homePath: string;
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;
  updateProfile: (body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }) => Promise<AdminUser>;
  uploadAvatar: (file: File) => Promise<AdminUser>;
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
            if (!isStaffRole(me.role)) throw new Error("Not staff");
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

  const value = useMemo<AuthContextValue>(() => {
    const role = isStaffRole(user?.role) ? user!.role : null;
    return {
      user,
      token,
      hydrated,
      isStaff: Boolean(user && token && role),
      role,
      can: (permission) => can(role, permission),
      homePath: homePathForRole(role),
      login: async (email, password) => {
        const data = await apiLogin(email, password);
        if (!isStaffRole(data.user.role)) {
          throw new Error("This account cannot access the admin panel");
        }
        setToken(data.token);
        setUser(data.user);
        return homePathForRole(data.user.role);
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
      updateProfile: async (body) => {
        if (!token) throw new Error("Not signed in");
        const { user: next } = await apiUpdateProfile(token, body);
        setUser(next);
        return next;
      },
      uploadAvatar: async (file) => {
        if (!token) throw new Error("Not signed in");
        const { user: next } = await apiUploadAvatar(token, file);
        setUser(next);
        return next;
      },
    };
  }, [user, token, hydrated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
