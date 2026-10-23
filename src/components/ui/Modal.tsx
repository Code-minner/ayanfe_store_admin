"use client";

import type { ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close overlay"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${
          wide ? "max-w-xl" : "max-w-md"
        }`}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
