"use client";

import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function TopBar({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4">
      <div className="min-w-0 text-sm text-neutral-500">{breadcrumb}</div>
      <div className="flex items-center gap-3">
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
        <button type="button" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-neutral-50">
          <span className="relative h-9 w-9 overflow-hidden rounded-full bg-[#F3E6F6]">
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="36px" />
            ) : (
              <span className="grid h-full w-full place-items-center text-sm font-semibold text-[#4B0A6B]">
                {(user?.name?.[0] || "A").toUpperCase()}
              </span>
            )}
          </span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
