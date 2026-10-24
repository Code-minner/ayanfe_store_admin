"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AdminNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const AdminNavContext = createContext<AdminNavContextValue | null>(null);

export function AdminNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((v) => !v),
    }),
    [open]
  );

  return <AdminNavContext.Provider value={value}>{children}</AdminNavContext.Provider>;
}

export function useAdminNav() {
  const ctx = useContext(AdminNavContext);
  if (!ctx) throw new Error("useAdminNav must be used within AdminNavProvider");
  return ctx;
}
