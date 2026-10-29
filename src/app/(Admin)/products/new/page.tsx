"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import ColorsEditor from "@/components/admin/ColorsEditor";
import PackVariantsEditor, {
  draftsToVariants,
  type PackVariantDraft,
} from "@/components/admin/PackVariantsEditor";
import ProductImagesEditor from "@/components/admin/ProductImagesEditor";
import { useAuth } from "@/context/AuthContext";
import { apiCreateProduct, apiGetCategories } from "@/lib/api";

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
  const [gallery, setGallery] = useState<string[]>([]);
  const [subtitle, setSubtitle] = useState("");
  const [brand, setBrand] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [active, setActive] = useState(true);
  const [bonusQty, setBonusQty] = useState("");
  const [bonusPercent, setBonusPercent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState("");

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

  const resetForm = () => {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setPrice("");
    setStock("50");
    setVariants([]);
    setColors([]);
    setDescription("");
    setImageUrl("");
    setGallery([]);
    setSubtitle("");
    setBrand("");
    setIsFeatured(false);
    setIsNewArrival(false);
    setActive(true);
    setBonusQty("");
    setBonusPercent("");
    setError("");
    if (categories[0]) setCategorySlug(categories[0].slug);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please sign in again");
      return;
    }
    const parsedPrice = Number(price);
    const main = imageUrl.trim() || gallery[0] || "";
    if (!name.trim() || !slug.trim() || !categorySlug || !main) {
      setError("Name, slug, category, and at least one image are required");
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

    const parsedBonusQty = bonusQty.trim()
      ? Number.parseInt(bonusQty, 10)
      : null;
    const parsedBonusPercent = bonusPercent.trim()
      ? Number(bonusPercent)
      : null;
    if (
      (parsedBonusQty !== null && (!Number.isFinite(parsedBonusQty) || parsedBonusQty < 1)) ||
      (parsedBonusPercent !== null &&
        (!Number.isFinite(parsedBonusPercent) ||
          parsedBonusPercent <= 0 ||
          parsedBonusPercent > 100))
    ) {
      setError("Quantity bonus: enter a buy qty of 1+ and a percent between 1 and 100, or leave both blank");
      return;
    }
    if (
      (parsedBonusQty !== null && parsedBonusPercent === null) ||
      (parsedBonusQty === null && parsedBonusPercent !== null)
    ) {
      setError("Quantity bonus needs both buy qty and percent off, or leave both blank");
      return;
    }

    const images = gallery.length
      ? gallery.includes(main)
        ? gallery
        : [main, ...gallery]
      : [main];

    setSaving(true);
    setError("");
    setCreatedId(null);
    try {
      const { product } = await apiCreateProduct(token, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        image: main,
        images,
        price: parsedPrice,
        categorySlug,
        category: categoryName,
        stock: Math.max(0, Number.parseInt(stock || "0", 10) || 0),
        variants: packVariants,
        colors: packVariants.length ? [] : colors,
        subtitle: subtitle.trim() || undefined,
        brand: brand.trim() || undefined,
        isFeatured,
        isNewArrival,
        active,
        bonusQty: parsedBonusQty,
        bonusPercent: parsedBonusPercent,
      });
      setCreatedId(product.id);
      setCreatedName(product.name);
      resetForm();
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
        <p className="mt-1 text-sm text-neutral-500">
          Create a catalog item. After saving you stay here to add another.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-6 max-w-3xl space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          {createdId ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-medium">
                &ldquo;{createdName}&rdquo; created. Form cleared for the next product.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link
                  href={`/products/${createdId}`}
                  className="font-semibold text-[#4B0A6B] hover:underline"
                >
                  Open it to edit
                </Link>
                <Link href="/products" className="font-semibold text-neutral-700 hover:underline">
                  Back to list
                </Link>
              </div>
            </div>
          ) : null}

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
            Brand
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. TITANIUM, AYE01 (shows on the store)"
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
            subtitleHint={subtitle}
            totalStockHint={Number.parseInt(stock || "0", 10) || 0}
          />

          <fieldset className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
            <legend className="px-1 text-sm font-semibold text-neutral-900">
              Quantity bonus (optional)
            </legend>
            <p className="mt-1 text-xs text-neutral-600">
              Example: buy 10 of this product (any size/color combined), get 5% off the unit
              price. Leave blank for no bonus.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Buy qty
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={bonusQty}
                  onChange={(e) => setBonusQty(e.target.value)}
                  placeholder="e.g. 10"
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
                />
              </label>
              <label className="block text-sm font-medium">
                Percent off
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.1"
                  value={bonusPercent}
                  onChange={(e) => setBonusPercent(e.target.value)}
                  placeholder="e.g. 5"
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
                />
              </label>
            </div>
          </fieldset>

          {variants.length === 0 ? (
            <ColorsEditor colors={colors} onChange={setColors} />
          ) : (
            <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
              Colors are set per size above. Product cards still show the combined color
              swatches from all sizes.
            </p>
          )}

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

          <ProductImagesEditor
            mainUrl={imageUrl}
            gallery={gallery}
            onMainChange={setImageUrl}
            onGalleryChange={setGallery}
            token={token}
            onError={setError}
          />

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
              disabled={saving}
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
