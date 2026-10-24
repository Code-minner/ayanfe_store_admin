"use client";

import { useState } from "react";

function optimizeCloudinary(url: string, width: number) {
  if (!url?.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (/\/upload\/(?:[^/]+,)*?(?:w_|f_auto)/.test(url)) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

export default function ProductThumb({
  src,
  alt = "",
  size = 40,
  className = "",
}: {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const raw = (src || "").trim();
  const isAbsolute = /^https?:\/\//i.test(raw);
  const isLocalAsset = raw.startsWith("/");

  if (!raw || failed || (!isAbsolute && !isLocalAsset)) {
    return (
      <span
        className={`grid place-items-center rounded-lg border border-neutral-200 bg-neutral-50 text-[10px] font-medium text-neutral-400 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        No img
      </span>
    );
  }

  const url = isAbsolute ? optimizeCloudinary(raw, Math.max(size * 2, 96)) : raw;

  return (
    <span
      className={`relative overflow-hidden rounded-lg border border-neutral-200 bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Native img: WooCommerce / Cloudinary hosts vary; next/image remotePatterns often block them. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain p-1"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
