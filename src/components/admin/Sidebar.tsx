"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dashboard,
  Usermanagement,
  Product,
  Orders,
  Payment,
  Setting,
  LogOutIcon,
} from "@/components/icons/svg";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  children?: { label: string; href: string }[];
};

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Dashboard className="h-5 w-5" />,
  },
  {
    label: "User Management",
    href: "/users",
    icon: <Usermanagement className="h-5 w-5" />,
    children: [
      { label: "Customers", href: "/users/customers" },
      { label: "Admins", href: "/users/admins" },
    ],
  },
  {
    label: "Products",
    href: "/products",
    icon: <Product className="h-5 w-5" />,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: <Orders className="h-5 w-5" />,
  },
  {
    label: "Payments",
    href: "/payments",
    icon: <Payment className="h-5 w-5" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Setting className="h-5 w-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [usersOpen, setUsersOpen] = useState(pathname.startsWith("/users"));

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="px-5 py-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#4B0A6B] text-sm font-bold text-white">
            A
          </span>
          <span className="text-sm font-bold tracking-wide text-[#4B0A6B]">
            AYANFE STORE
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
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
            router.push("/login");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6C6C6C] hover:bg-neutral-50 hover:text-neutral-900"
        >
          <LogOutIcon className="h-5 w-5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
