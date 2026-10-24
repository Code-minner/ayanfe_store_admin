import type { ReactNode } from "react";

/** Shared admin page shell (full width, consistent padding). */
export default function AdminMain({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={`w-full flex-1 px-4 py-4 sm:px-6 sm:py-6 ${className}`}>
      {children}
    </main>
  );
}
