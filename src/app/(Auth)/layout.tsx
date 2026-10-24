import type { ReactNode } from "react";
import BrandLogo from "@/components/BrandLogo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#F5F5F7]">
      <div className="absolute left-4 top-5 sm:left-10 sm:top-8">
        <BrandLogo href="/login" size="md" />
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        {children}
      </div>
    </div>
  );
}
