import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#F5F5F7]">
      <div className="absolute left-6 top-6 sm:left-10 sm:top-8">
        <Link href="/login" className="inline-flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#4B0A6B] text-sm font-bold text-white">
            A
          </span>
          <span className="text-sm font-bold tracking-wide text-[#4B0A6B]">
            AYANFE STORE
          </span>
        </Link>
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        {children}
      </div>
    </div>
  );
}