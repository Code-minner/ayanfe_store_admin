"use client";

import { useState } from "react";

export type PackVariantDraft = {
  id: string;
  label: string;
  price: string;
  stock: string;
  /** Max units one customer can buy of this option in one order. Empty = no extra cap. */
  maxPerOrder: string;
};

type OptionPreset = {
  id: string;
  label: string;
  values: string[];
};

const OPTION_PRESETS: OptionPreset[] = [
  {
    id: "shoe-eu",
    label: "Shoe EU 36-46",
    values: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  },
  {
    id: "clothing",
    label: "Clothing XS-XXL",
    values: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  {
    id: "kids-age",
    label: "Kids age 1-10",
    values: [
      "Age 1",
      "Age 2",
      "Age 3",
      "Age 4",
      "Age 5",
      "Age 6",
      "Age 7",
      "Age 8",
      "Age 9",
      "Age 10",
    ],
  },
  {
    id: "packs",
    label: "Pack counts",
    values: ["1 piece", "5 pieces", "10 pieces", "20 pieces", "50 pieces", "100 pieces"],
  },
];

function slugifyPack(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function parseLabels(raw: string): string[] {
  return raw
    .split(/[,|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type Props = {
  variants: PackVariantDraft[];
  onChange: (next: PackVariantDraft[]) => void;
  /** Default price used when quick-adding options. */
  defaultPrice?: string;
  /** Optional subtitle like "Sizes: 40, 41" for one-click import. */
  subtitleHint?: string;
  totalStockHint?: number;
};

export default function PackVariantsEditor({
  variants,
  onChange,
  defaultPrice = "",
  subtitleHint = "",
  totalStockHint = 0,
}: Props) {
  const [bulkLabels, setBulkLabels] = useState("");

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

  const defaultRowPrice = () =>
    defaultPrice.trim() || variants.find((v) => v.price.trim())?.price || "0";

  const addLabels = (labels: string[], stock = "0") => {
    const price = defaultRowPrice();
    const next = [...variants];
    let added = 0;
    for (const label of labels) {
      if (next.some((v) => v.label.trim().toLowerCase() === label.toLowerCase())) continue;
      next.push({
        id: slugifyPack(label) || `opt-${next.length + 1}`,
        label,
        price,
        stock,
        maxPerOrder: "",
      });
      added += 1;
    }
    if (added) onChange(next);
  };

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

  const applyBulk = () => {
    const labels = parseLabels(bulkLabels);
    if (!labels.length) return;
    addLabels(labels);
    setBulkLabels("");
  };

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-[#FAFAFA] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">Options buyers must pick</p>
          <p className="mt-1 text-xs text-neutral-500">
            Leave empty for a simple product (buyers add with base stock only). Add options only
            when you set real stock per size/pack. New and edited products with options get the
            size/color popup on the store.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {subtitleHint.trim() ? (
            <button
              type="button"
              onClick={() => {
                const seeded = draftsFromSubtitle(
                  subtitleHint,
                  defaultRowPrice(),
                  totalStockHint
                );
                if (!seeded.length) return;
                onChange(seeded);
              }}
              className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Import from subtitle
            </button>
          ) : null}
          <button
            type="button"
            onClick={addRow}
            className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Add option
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <p className="text-xs font-medium text-neutral-700">Add many at once</p>
        <p className="mt-0.5 text-[11px] text-neutral-500">
          Type or paste labels separated by commas (example: 40, 41, 42 or S, M, L or Age 5, Age 6).
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={bulkLabels}
            onChange={(e) => setBulkLabels(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              applyBulk();
            }}
            placeholder="S, M, L, XL"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-[#4B0A6B]"
          />
          <button
            type="button"
            onClick={applyBulk}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-50"
          >
            Add labels
          </button>
        </div>

        <p className="mt-3 text-[11px] font-medium text-neutral-600">Optional presets</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {OPTION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => addLabels(preset.values)}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:border-[#4B0A6B] hover:text-[#4B0A6B]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {variants.length > 0 ? (
        <ul className="space-y-3">
          <p className="text-xs font-medium text-neutral-600">
            Options ({variants.length}). Set stock for each. Stock 0 = sold out.
          </p>
          {variants.map((row, index) => (
            <li
              key={`${row.id}-${index}`}
              className="grid gap-2 rounded-lg border border-neutral-200 bg-white p-3 sm:grid-cols-[1.2fr_0.9fr_0.7fr_0.9fr_auto]"
            >
              <label className="block text-xs font-medium text-neutral-600">
                Label
                <input
                  value={row.label}
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                  placeholder="e.g. 42, M, 10 pieces, Design A"
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
                  placeholder="e.g. 4"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-[#4B0A6B]"
                />
                <span className="mt-1 block text-[10px] font-normal text-neutral-500">
                  Per this option (+ color). Other sizes/colors stay buyable.
                </span>
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
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-4 text-center text-xs text-neutral-500">
          No options yet. Add labels above, use a preset, or click Add option.
        </p>
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

/** Seed option rows from a "Sizes: 40, 41" subtitle when variants were never saved. */
export function draftsFromSubtitle(
  subtitle: string | null | undefined,
  defaultPrice: string,
  totalStock = 0
): PackVariantDraft[] {
  if (!subtitle) return [];
  const match = subtitle.match(/(?:sizes?|options?)\s*:\s*(.+)/i);
  if (!match?.[1]) return [];
  const labels = match[1]
    .split(/[,|/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!labels.length) return [];
  const count = labels.length;
  const base = totalStock > 0 ? Math.floor(totalStock / count) : 0;
  const rem = totalStock > 0 ? totalStock % count : 0;
  return labels.map((label, i) => ({
    id: slugifyPack(label) || `opt-${label}`,
    label,
    price: defaultPrice || "0",
    stock: String(base + (i < rem ? 1 : 0)),
    maxPerOrder: "",
  }));
}
