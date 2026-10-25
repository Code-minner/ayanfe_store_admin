"use client";

import { useRef } from "react";

type Props = {
  open: boolean;
  title?: string;
  html: string;
  onClose: () => void;
};

/** In-app preview of the print HTML (invoice look unchanged). */
export default function PrintPreviewModal({
  open,
  title = "Invoice preview",
  html,
  onClose,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!open || !html) return null;

  const embedHtml = html
    .replace(/<div class="toolbar">[\s\S]*?<\/div>/i, "")
    .replace(
      "</head>",
      `<style>
        html, body { background: #fff !important; }
        .wrap { padding: 12px !important; }
        .sheet { box-shadow: none !important; border: 0 !important; }
      </style></head>`
    );

  const printDoc = () => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={printDoc}
              className="rounded-lg bg-[#4B0A6B] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3a0854]"
            >
              Download / Print
            </button>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          title={title}
          srcDoc={embedHtml}
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      </div>
    </div>
  );
}
