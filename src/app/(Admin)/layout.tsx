"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { hydrated, isStaff } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!isStaff) router.replace("/login");
  }, [hydrated, isStaff, router]);

  if (!hydrated || !isStaff) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F5F5F7] text-sm text-neutral-500">
        Checking staff session...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
