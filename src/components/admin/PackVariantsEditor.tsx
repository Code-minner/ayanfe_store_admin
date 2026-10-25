"use client";

export type PackVariantDraft = {
  id: string;
  label: string;
  price: string;
  stock: string;
  /** Max units one customer can buy of this size/option in one order. Empty = no extra cap. */
  maxPerOrder: string;
};

const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

function slugifyPack(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

type Props = {
  variants: PackVariantDraft[];
  onChange: (next: PackVariantDraft[]) => void;
  /** Default price used when quick-adding shoe sizes. */
  defaultPrice?: string;
};

export default function PackVariantsEditor({ variants, onChange, defaultPrice = "" }: Props) {
  const updateRow = (index: number, patch: Partial<PackVariantDraft>) => {
    onChange(
      variants.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (patch.label !== undefined && !row.id) {
          next.id = slugifyPack(patch.label) || `opt-${index + 1}`;
        }
        return next;
      })
    );
  };

  const upsertSize = (label: string, stock: string) => {
    const existing = variants.findIndex((v) => v.label.trim() === label);
    if (existing >= 0) {
      // Clear stock 0 rows only if user emptied the field; keep row so they can edit.
      updateRow(existing, { stock: stock.trim() === "" ? "0" : stock });
      return;
    }
    if (!stock.trim() || Number(stock) <= 0) return;
    const price =
      defaultPrice.trim() ||
      variants.find((v) => v.price.trim())?.price ||
      "0";
    onChange([
      ...variants,
      {
        id: slugifyPack(label) || `size-${label}`,
        label,
        price,
        stock,
        maxPerOrder: "",
      },
    ]);
  };

  const stockFor = (label: string) =>
    variants.find((v) => v.label.trim() === label)?.stock ?? "";

  const addRow = () => {
    onChange([
      ...variants,
      {
        id: `opt-${variants.length + 1}`,
        label: "",
        price: defaultPrice || "",
        stock: "0",
        maxPerOrder: "",
      },
    ]);
  };

  const removeRow = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const fillShoeSizes = () => {
    const price = defaultPrice || variants[0]?.price || "";
    const next = [...variants];
    for (const size of SHOE_SIZES) {
      if (next.some((v) => v.label.trim() === size)) continue;
      next.push({
        id: `size-${size}`,
        label: size,
        price,
        stock: "0",
        maxPerOrder: "",
      });
    }
    onChange(next);
  };

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-[#FAFAFA] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">Sizes / options (with stock)</p>
          <p className="mt-1 text-xs text-neutral-500">
            Type how many pairs you have for each size. Buyers will pick a size on the product page.
            Leave stock at 0 to hide that size as sold out, or remove the row.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillShoeSizes}
            className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Add shoe sizes 36-46
          </button>
          <button
            type="button"
            onClick={addRow}
            className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Add custom option
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <p className="text-xs font-medium text-neutral-700">Quick stock by shoe size</p>
        <p className="mt-0.5 text-[11px] text-neutral-500">
          Enter available quantity for each size. Empty or 0 means not offered / sold out.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {SHOE_SIZES.map((size) => (
            <label key={size} className="block text-center text-xs font-semibold text-neutral-700">
              {size}
              <input
                type="number"
                min="0"
                step="1"
                value={stockFor(size)}
                onChange={(e) => upsertSize(size, e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-2 text-center text-sm outline-none focus:border-[#4B0A6B]"
              />
            </label>
          ))}
        </div>
      </div>

      {variants.length > 0 && (
        <ul className="space-y-3">
          <p className="text-xs font-medium text-neutral-600">All options (edit price / max per order)</p>
          {variants.map((row, index) => (
            <li
              key={`${row.id}-${index}`}
              className="grid gap-2 rounded-lg border border-neutral-200 bg-white p-3 sm:grid-cols-[1fr_0.9fr_0.7fr_0.9fr_auto]"
            >
              <label className="block text-xs font-medium text-neutral-600">
                Size / label
                <input
                  value={row.label}
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                  placeholder="45"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-[#4B0A6B]"
                />
              </label>
              <label className="block text-xs font-medium text-neutral-600">
                Price (NGN)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={row.price}
                  onChange={(e) => updateRow(index, { price: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-[#4B0A6B]"
                />
              </label>
              <label className="block text-xs font-medium text-neutral-600">
                Stock
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={row.stock}
                  onChange={(e) => updateRow(index, { stock: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-[#4B0A6B]"
                />
              </label>
              <label className="block text-xs font-medium text-neutral-600">
                Max per order
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={row.maxPerOrder}
                  onChange={(e) => updateRow(index, { maxPerOrder: e.target.value })}
                  placeholder="e.g. 5"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-[#4B0A6B]"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="rounded-lg px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function draftsToVariants(drafts: PackVariantDraft[]) {
  return drafts
    .filter((d) => d.label.trim() && Number.isFinite(Number(d.price)) && Number(d.price) >= 0)
    .map((d, index) => {
      const maxRaw = d.maxPerOrder.trim();
      const maxParsed = maxRaw ? Number.parseInt(maxRaw, 10) : undefined;
      return {
        id: d.id.trim() || slugifyPack(d.label) || `opt-${index + 1}`,
        label: d.label.trim(),
        price: Math.max(0, Number(d.price) || 0),
        stock: Math.max(0, Number.parseInt(d.stock || "0", 10) || 0),
        ...(maxParsed && maxParsed > 0 ? { maxPerOrder: maxParsed } : {}),
      };
    });
}

export function variantsToDrafts(
  variants:
    | { id: string; label: string; price: number; stock: number; maxPerOrder?: number }[]
    | null
    | undefined
): PackVariantDraft[] {
  if (!Array.isArray(variants) || !variants.length) return [];
  return variants.map((v) => ({
    id: v.id,
    label: v.label,
    price: String(v.price),
    stock: String(v.stock),
    maxPerOrder: v.maxPerOrder && v.maxPerOrder > 0 ? String(v.maxPerOrder) : "",
  }));
}
