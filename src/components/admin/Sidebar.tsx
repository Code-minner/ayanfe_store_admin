"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdminNav } from "@/context/AdminNavContext";
import {
  Dashboard,
  Usermanagement,
  Product,
  Orders,
  Payment,
  Setting,
  LogOutIcon,
} from "@/components/icons/svg";
import type { StaffPermission } from "@/lib/roles";
import { roleLabel } from "@/lib/roles";
import BrandLogo from "@/components/BrandLogo";

type NavChild = { label: string; href: string; permission: StaffPermission };
type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  permission?: StaffPermission;
  children?: NavChild[];
};

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Dashboard className="h-5 w-5" />,
    permission: "dashboard",
  },
  {
    label: "User Management",
    href: "/users",
    icon: <Usermanagement className="h-5 w-5" />,
    children: [
      { label: "Customers", href: "/users/customers", permission: "customers" },
      { label: "Staff", href: "/users/admins", permission: "admins" },
    ],
  },
  {
    label: "Products",
    href: "/products",
    icon: <Product className="h-5 w-5" />,
    permission: "products",
  },
  {
    label: "Orders",
    href: "/orders",
    icon: <Orders className="h-5 w-5" />,
    permission: "orders",
  },
  {
    label: "Payments",
    href: "/payments",
    icon: <Payment className="h-5 w-5" />,
    permission: "payments",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Setting className="h-5 w-5" />,
    permission: "settings",
  },
  {
    label: "My access",
    href: "/access",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" strokeLinejoin="round" />
        <path d="M9.5 12l1.8 1.8L14.8 10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, can, user, homePath } = useAuth();
  const { open, setOpen } = useAdminNav();
  const [usersOpen, setUsersOpen] = useState(pathname.startsWith("/users"));

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);

  const visibleNav = NAV.map((item) => {
    if (item.children) {
      const children = item.children.filter((c) => can(c.permission));
      if (children.length === 0) return null;
      return { ...item, children };
    }
    if (item.permission && !can(item.permission)) return null;
    return item;
  }).filter(Boolean) as NavItem[];

  const closeIfMobile = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(240px,88vw)] shrink-0 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:w-[240px] lg:translate-x-0 ${
          open ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-2 px-4 py-5 sm:px-5 sm:py-6">
          <div className="min-w-0">
            <BrandLogo href={homePath} size="sm" />
            {user?.role ? (
              <p className="mt-3 text-xs font-medium text-neutral-500">{roleLabel(user.role)}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            if (item.children) {
              const childActive = item.children.some(
                (c) => pathname === c.href || pathname.startsWith(`${c.href}/`)
              );
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => setUsersOpen((v) => !v)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      childActive
                        ? "bg-[#4B0A6B] text-white"
                        : "text-[#6C6C6C] hover:bg-neutral-50 hover:text-neutral-800"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 transition ${usersOpen || childActive ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                    </svg>
                  </button>
                  {(usersOpen || childActive) && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-neutral-200 pl-3">
                      {item.children.map((child) => {
                        const isChild =
                          pathname === child.href || pathname.startsWith(`${child.href}/`);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={closeIfMobile}
                            className={`block rounded-lg px-2 py-2 text-sm ${
                              isChild
                                ? "border-l-2 border-[#4B0A6B] pl-2 font-semibold text-neutral-900"
                                : "text-neutral-500 hover:text-neutral-800"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeIfMobile}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active
                    ? "bg-[#4B0A6B] text-white"
                    : "text-[#6C6C6C] hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200 p-3">
          <button
            type="button"
            onClick={() => {
              logout();
              setOpen(false);
              router.push("/login");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6C6C6C] hover:bg-neutral-50 hover:text-neutral-900"
          >
            <LogOutIcon className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
