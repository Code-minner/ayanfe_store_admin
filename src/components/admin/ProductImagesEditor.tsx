"use client";

import { useRef, useState } from "react";
import ProductThumb from "@/components/admin/ProductThumb";
import { apiUploadProductImage } from "@/lib/api";

type Props = {
  mainUrl: string;
  gallery: string[];
  onMainChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
  token: string | null;
  onError: (message: string) => void;
};

export default function ProductImagesEditor({
  mainUrl,
  gallery,
  onMainChange,
  onGalleryChange,
  token,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const addUrls = (urls: string[]) => {
    if (!urls.length) return;
    onGalleryChange([
      ...urls,
      ...gallery.filter((u) => !urls.includes(u)),
    ]);
    if (!mainUrl.trim() && urls[0]) onMainChange(urls[0]);
  };

  const onPickFiles = async (list: FileList | null) => {
    if (!list?.length || !token) return;
    const files = Array.from(list).filter((f) =>
      ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(f.type)
    );
    if (!files.length) {
      onError("Please choose PNG, JPG, or WebP images.");
      return;
    }

    setUploading(true);
    onError("");
    const uploaded: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading ${i + 1} of ${files.length}...`);
        const result = await apiUploadProductImage(token, files[i]);
        uploaded.push(result.url);
      }
      addUrls(uploaded);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (src: string) => {
    const next = gallery.filter((u) => u !== src);
    onGalleryChange(next);
    if (mainUrl === src) onMainChange(next[0] || "");
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Product images</p>
        <p className="mt-1 text-xs text-neutral-500">
          Select one or many images at once. First image (or the one you mark) is the main
          storefront photo.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50">
          {uploading ? progress || "Uploading..." : "Upload images"}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            disabled={uploading || !token}
            onChange={(e) => void onPickFiles(e.target.files)}
          />
        </label>
        <input
          value={mainUrl}
          onChange={(e) => {
            const url = e.target.value;
            onMainChange(url);
            if (url.trim() && !gallery.includes(url.trim())) {
              onGalleryChange([url.trim(), ...gallery]);
            }
          }}
          placeholder="Or paste main image URL"
          className="min-w-[240px] flex-1 rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#4B0A6B]"
        />
      </div>

      {gallery.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {gallery.map((src) => (
            <div key={src} className="relative">
              <button
                type="button"
                onClick={() => onMainChange(src)}
                className={`block overflow-hidden rounded-xl border bg-white ${
                  src === mainUrl ? "border-[#4B0A6B] ring-2 ring-[#4B0A6B]/30" : "border-neutral-200"
                }`}
                title="Set as main image"
              >
                <ProductThumb src={src} alt="" size={88} />
              </button>
              {src === mainUrl ? (
                <span className="absolute bottom-1 left-1 rounded bg-[#4B0A6B] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Main
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => removeAt(src)}
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-neutral-900 text-[10px] text-white"
                aria-label="Remove image"
              >
                x
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
