"use client";

import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useAdminNav } from "@/context/AdminNavContext";

export default function TopBar({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  const { user } = useAuth();
  const { toggle } = useAdminNav();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-neutral-700 hover:bg-neutral-50 lg:hidden"
          aria-label="Open menu"
          onClick={toggle}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
        <div className="min-w-0 truncate text-sm text-neutral-500">{breadcrumb}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-full text-neutral-600 hover:bg-neutral-50"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21h4" strokeLinecap="round" />
          </svg>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <button type="button" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 hover:bg-neutral-50 sm:pr-2">
          <span className="relative h-9 w-9 overflow-hidden rounded-full bg-[#F3E6F6]">
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="36px" />
            ) : (
              <span className="grid h-full w-full place-items-center text-sm font-semibold text-[#4B0A6B]">
                {(user?.name?.[0] || "A").toUpperCase()}
              </span>
            )}
          </span>
          <svg
            viewBox="0 0 24 24"
            className="hidden h-4 w-4 text-neutral-500 sm:block"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
