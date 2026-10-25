"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import ProductThumb from "@/components/admin/ProductThumb";
import ColorsEditor from "@/components/admin/ColorsEditor";
import PackVariantsEditor, {
  draftsToVariants,
  type PackVariantDraft,
} from "@/components/admin/PackVariantsEditor";
import { useAuth } from "@/context/AuthContext";
import {
  apiCreateProduct,
  apiGetCategories,
  apiUploadProductImage,
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

export default function NewProductPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("50");
  const [variants, setVariants] = useState<PackVariantDraft[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [categorySlug, setCategorySlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [brand, setBrand] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [active, setActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGetCategories()
      .then((data) => {
        setCategories(data.categories || []);
        if (data.categories?.[0] && !categorySlug) {
          setCategorySlug(data.categories[0].slug);
        }
      })
      .catch(() => setCategories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryName = useMemo(
    () => categories.find((c) => c.slug === categorySlug)?.name || categorySlug,
    [categories, categorySlug]
  );

  const onNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const onUpload = async (file: File | null) => {
    if (!file || !token) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await apiUploadProductImage(token, file);
      setImageUrl(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
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
      setError("Fill size/option label and price, or remove empty rows");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { product } = await apiCreateProduct(token, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        image: imageUrl.trim(),
        images: [imageUrl.trim()],
        price: parsedPrice,
        categorySlug,
        category: categoryName,
        stock: Math.max(0, Number.parseInt(stock || "0", 10) || 0),
        variants: packVariants,
        colors,
        subtitle: subtitle.trim() || undefined,
        brand: brand.trim() || undefined,
        isFeatured,
        isNewArrival,
        active,
      });
      router.push(`/products/${product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar
        breadcrumb={
          <>
            <Link href="/products" className="hover:text-neutral-800">
              Products
            </Link>{" "}
            &gt; <span className="font-semibold text-neutral-900">Add product</span>
          </>
        }
      />
      <AdminMain>
        <h1 className="text-2xl font-semibold">Add product</h1>
        <p className="mt-1 text-sm text-neutral-500">Create a new catalog item for the storefront.</p>

        <form
          onSubmit={onSubmit}
          className="mt-6 max-w-3xl space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <label className="block text-sm font-medium">
            Product name
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            />
          </label>

          <label className="block text-sm font-medium">
            Slug
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
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

          <PackVariantsEditor
            variants={variants}
            onChange={setVariants}
            defaultPrice={price}
          />

          <ColorsEditor colors={colors} onChange={setColors} />

          <label className="block text-sm font-medium">
            Brand
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. TITANIUM, AYE01"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            />
          </label>

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

          <label className="block text-sm font-medium">
            Subtitle (optional sizes note)
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Sizes: 40, 41, 42"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            />
          </label>

          <div>
            <p className="text-sm font-medium">Product image</p>
            <div className="mt-2 flex flex-wrap items-start gap-4">
              <label className="inline-flex cursor-pointer items-center rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50">
                {uploading ? "Uploading..." : "Upload image"}
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
                placeholder="Or paste image URL"
                className="min-w-[240px] flex-1 rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#4B0A6B]"
              />
            </div>
            {imageUrl ? (
              <div className="mt-3">
                <ProductThumb src={imageUrl} alt="" size={112} className="rounded-xl" />
              </div>
            ) : null}
          </div>

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
              {saving ? "Saving..." : "Create product"}
            </button>
            <Link
              href="/products"
              className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </AdminMain>
    </>
  );
}
