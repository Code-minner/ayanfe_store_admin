"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { StaffPermission } from "@/lib/roles";

export default function RequirePermission({
  permission,
  children,
}: {
  permission: StaffPermission;
  children: ReactNode;
}) {
  const { hydrated, isStaff, can, homePath } = useAuth();
  const router = useRouter();
  const allowed = can(permission);

  useEffect(() => {
    if (!hydrated || !isStaff) return;
    if (!allowed) router.replace(homePath);
  }, [hydrated, isStaff, allowed, homePath, router]);

  if (!hydrated || !isStaff || !allowed) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-sm text-neutral-500">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}
