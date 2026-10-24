"use client";

import Link from "next/link";
import { Logo } from "@/components/icons/brand";
import { BRAND_NAME } from "@/lib/brand";

type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, string> = {
  sm: "h-6 w-auto max-w-[9rem] sm:h-7 sm:max-w-[10.5rem]",
  md: "h-7 w-auto max-w-[10.5rem] sm:h-8 sm:max-w-[12rem]",
  lg: "h-8 w-auto max-w-[12rem] sm:h-9 sm:max-w-none",
};

export default function BrandLogo({
  href = "/",
  size = "md",
  className = "",
}: {
  href?: string | null;
  size?: Size;
  className?: string;
}) {
  const mark = <Logo className={`${SIZE[size]} shrink-0`} />;

  if (!href) {
    return (
      <span className={`inline-flex max-w-full items-center ${className}`} aria-label={BRAND_NAME}>
        {mark}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={`${BRAND_NAME} home`}
      className={`inline-flex max-w-full items-center ${className}`}
    >
      {mark}
    </Link>
  );
}
