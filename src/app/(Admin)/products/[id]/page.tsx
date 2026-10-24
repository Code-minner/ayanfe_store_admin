"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/admin/TopBar";
import ProductThumb from "@/components/admin/ProductThumb";
import PackVariantsEditor, {
  draftsToVariants,
  variantsToDrafts,
  type PackVariantDraft,
} from "@/components/admin/PackVariantsEditor";
import { useAuth } from "@/context/AuthContext";
import {
  apiGetCategories,
  apiGetProduct,
  apiUpdateProduct,
  apiUploadProductImage,
  type AdminProduct,
} from "@/lib/api";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function ProductEditPage() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [variants, setVariants] = useState<PackVariantDraft[]>([]);
  const [categorySlug, setCategorySlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiGetCategories()
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGetProduct(params.id);
        const p = data.product;
        setProduct(p);
        setName(p.name);
        setSlug(p.slug);
        setPrice(String(p.price ?? ""));
        setStock(String(p.stock ?? 0));
        setVariants(variantsToDrafts(p.variants));
        setCategorySlug(p.categorySlug);
        setDescription(p.description || "");
        setImageUrl(p.image);
        setGallery(p.images?.length ? p.images : p.image ? [p.image] : []);
        setSubtitle(p.subtitle || "");
        setBadge(p.badge || "");
        setIsFeatured(Boolean(p.isFeatured));
        setIsNewArrival(Boolean(p.isNewArrival));
        setActive(p.active !== false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Product not found");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [params.id]);

  const categoryName = useMemo(
    () => categories.find((c) => c.slug === categorySlug)?.name || categorySlug,
    [categories, categorySlug]
  );

  const onUpload = async (file: File | null) => {
    if (!file || !token) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await apiUploadProductImage(token, file);
      setImageUrl(uploaded.url);
      setGallery((prev) => {
        const next = [uploaded.url, ...prev.filter((u) => u !== uploaded.url)];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !product) {
      setError("Please sign in again");
      return;
    }
    const parsedPrice = Number(price);
    if (!name.trim() || !slug.trim() || !categorySlug || !imageUrl.trim()) {
      setError("Name, slug, category, and image are required");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid price");
      return;
    }

    const packVariants = draftsToVariants(variants);
    if (variants.length && !packVariants.length) {
      setError("Fill pack label and price, or remove empty pack rows");
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const images = gallery.length ? gallery : [imageUrl.trim()];
      const { product: updated } = await apiUpdateProduct(token, product.id, {
        name: name.trim(),
        slug: slugify(slug.trim()),
        description: description.trim(),
        image: imageUrl.trim(),
        images: images.includes(imageUrl.trim()) ? images : [imageUrl.trim(), ...images],
        price: parsedPrice,
        categorySlug,
        category: categoryName,
        stock: Math.max(0, Number.parseInt(stock || "0", 10) || 0),
        variants: packVariants,
        subtitle: subtitle.trim() || null,
        badge: badge.trim() || null,
        isFeatured,
        isNewArrival,
        active,
      });
      setProduct(updated);
      setVariants(variantsToDrafts(updated.variants));
      setPrice(String(updated.price ?? parsedPrice));
      setStock(String(updated.stock ?? 0));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <TopBar
          breadcrumb={
            <>
              <Link href="/products">Products</Link> &gt;{" "}
              <span className="font-semibold text-neutral-900">Edit</span>
            </>
          }
        />
        <main className="p-6 text-sm text-neutral-500">Loading product...</main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <TopBar
          breadcrumb={
            <>
              <Link href="/products">Products</Link> &gt;{" "}
              <span className="font-semibold text-neutral-900">Edit</span>
            </>
          }
        />
        <main className="p-6 text-sm text-red-600">{error || "Product not found"}</main>
      </>
    );
  }

  return (
    <>
      <TopBar
        breadcrumb={
          <>
            <Link href="/products">Products</Link> &gt;{" "}
            <span className="font-semibold text-neutral-900">Edit</span>
          </>
        }
      />
      <main className="flex-1 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Edit product</h1>
            <p className="mt-1 text-sm text-neutral-500">{product.slug}</p>
          </div>
          <Link
            href="/products"
            className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Back to list
          </Link>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 max-w-3xl space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {saved && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Product saved.
            </p>
          )}

          <label className="block text-sm font-medium">
            Product name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            />
          </label>

          <label className="block text-sm font-medium">
            Slug
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Base price (NGN)
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Used when there are no packs. With packs, price becomes the lowest pack price.
              </span>
            </label>
            <label className="block text-sm font-medium">
              Base stock
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
              />
            </label>
          </div>

          <PackVariantsEditor variants={variants} onChange={setVariants} />

          <label className="block text-sm font-medium">
            Category
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Subtitle
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Sizes: 40, 41, 42"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
              />
            </label>
            <label className="block text-sm font-medium">
              Badge
              <input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Sale, New"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-medium">Main image</p>
            <div className="mt-2 flex flex-wrap items-start gap-4">
              <label className="inline-flex cursor-pointer items-center rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50">
                {uploading ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploading || !token}
                  onChange={(e) => void onUpload(e.target.files?.[0] || null)}
                />
              </label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL"
                className="min-w-[240px] flex-1 rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#4B0A6B]"
              />
            </div>
            {imageUrl ? (
              <div className="mt-3">
                <ProductThumb src={imageUrl} alt="" size={112} className="rounded-xl" />
              </div>
            ) : null}
          </div>

          {gallery.length > 0 && (
            <div>
              <p className="text-sm font-medium">Gallery</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {gallery.map((src) => (
                  <div key={src} className="relative">
                    <button
                      type="button"
                      onClick={() => setImageUrl(src)}
                      className={`block overflow-hidden rounded-xl border bg-white ${
                        src === imageUrl ? "border-[#4B0A6B]" : "border-neutral-200"
                      }`}
                      title="Set as main image"
                    >
                      <ProductThumb src={src} alt="" size={80} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGallery((prev) => prev.filter((u) => u !== src))}
                      className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-neutral-900 text-[10px] text-white"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-5 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Active
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              Featured
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
              />
              New arrival
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-xl bg-[#4B0A6B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3a0854] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
