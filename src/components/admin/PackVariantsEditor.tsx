"use client";

import { useState } from "react";
import { colorDisplayName } from "@/lib/format";

export type PackColorDraft = {
  value: string;
  stock: string;
};

export type PackVariantDraft = {
  id: string;
  label: string;
  price: string;
  stock: string;
  /** Max units one customer can buy of this option in one order. Empty = no extra cap. */
  maxPerOrder: string;
  /** Colors for this size/option, each with its own stock. */
  colors: PackColorDraft[];
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

const COLOR_PRESETS = [
  { label: "Black", value: "#111111" },
  { label: "White", value: "#FFFFFF" },
  { label: "Gold", value: "#C9A227" },
  { label: "Silver", value: "#C0C0C0" },
  { label: "Pink", value: "#F9A8D4" },
  { label: "Brown", value: "#8B5E3C" },
  { label: "Red", value: "#DC2626" },
  { label: "Blue", value: "#2563EB" },
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

function emptyRow(partial?: Partial<PackVariantDraft>): PackVariantDraft {
  return {
    id: partial?.id ?? "",
    label: partial?.label ?? "",
    price: partial?.price ?? "",
    stock: partial?.stock ?? "0",
    maxPerOrder: partial?.maxPerOrder ?? "",
    colors: partial?.colors ?? [],
  };
}

function colorStockSum(colors: PackColorDraft[]) {
  return colors.reduce((sum, c) => sum + (Number.parseInt(c.stock || "0", 10) || 0), 0);
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
  const [customColorByRow, setCustomColorByRow] = useState<Record<number, string>>({});

  const updateRow = (index: number, patch: Partial<PackVariantDraft>) => {
    onChange(
      variants.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (patch.label !== undefined && !row.id) {
          next.id = slugifyPack(patch.label) || `opt-${index + 1}`;
        }
        if (patch.colors) {
          next.stock = String(colorStockSum(patch.colors));
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
      next.push(
        emptyRow({
          id: slugifyPack(label) || `opt-${next.length + 1}`,
          label,
          price,
          stock,
        })
      );
      added += 1;
    }
    if (added) onChange(next);
  };

  const addRow = () => {
    onChange([
      ...variants,
      emptyRow({
        id: `opt-${variants.length + 1}`,
        price: defaultPrice || "",
      }),
    ]);
  };

  const removeRow = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const addColorToRow = (index: number, value: string) => {
    const next = value.trim();
    if (!next) return;
    const row = variants[index];
    if (!row) return;
    if (row.colors.some((c) => c.value.toLowerCase() === next.toLowerCase())) return;
    updateRow(index, {
      colors: [...row.colors, { value: next, stock: "0" }],
    });
  };

  const updateColorStock = (index: number, colorIndex: number, stock: string) => {
    const row = variants[index];
    if (!row) return;
    const colors = row.colors.map((c, i) => (i === colorIndex ? { ...c, stock } : c));
    updateRow(index, { colors });
  };

  const removeColorFromRow = (index: number, colorIndex: number) => {
    const row = variants[index];
    if (!row) return;
    updateRow(index, { colors: row.colors.filter((_, i) => i !== colorIndex) });
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
            Add sizes/options, then add colors under each size and set how many are in stock for
            each color.
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
          Type or paste labels separated by commas (example: 40, 41, 42 or S, M, L).
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
            Options ({variants.length}). Set colors and stock for each size.
          </p>
          {variants.map((row, index) => {
            const hasColors = row.colors.length > 0;
            const totalFromColors = colorStockSum(row.colors);
            return (
              <li
                key={`${row.id}-${index}`}
                className="space-y-3 rounded-lg border border-neutral-200 bg-white p-3"
              >
                <div className="grid gap-2 sm:grid-cols-[1.2fr_0.9fr_0.7fr_0.9fr_auto]">
                  <label className="block text-xs font-medium text-neutral-600">
                    Label
                    <input
                      value={row.label}
                      onChange={(e) => updateRow(index, { label: e.target.value })}
                      placeholder="e.g. 42, M, 10 pieces"
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
                    {hasColors ? "Total stock" : "Stock"}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={hasColors ? String(totalFromColors) : row.stock}
                      onChange={(e) => updateRow(index, { stock: e.target.value })}
                      disabled={hasColors}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-[#4B0A6B] disabled:bg-neutral-50 disabled:text-neutral-500"
                    />
                    {hasColors ? (
                      <span className="mt-1 block text-[10px] font-normal text-neutral-500">
                        Sum of color stocks below
                      </span>
                    ) : null}
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
                </div>

                <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 p-2.5">
                  <p className="text-xs font-medium text-neutral-700">
                    Colors for {row.label.trim() || "this size"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-neutral-500">
                    Add a color, then set how many of that color are in stock for this size.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => addColorToRow(index, p.label)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium hover:border-[#4B0A6B]"
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-neutral-300"
                          style={{ backgroundColor: p.value }}
                        />
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      value={customColorByRow[index] ?? ""}
                      onChange={(e) =>
                        setCustomColorByRow((prev) => ({ ...prev, [index]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        addColorToRow(index, customColorByRow[index] ?? "");
                        setCustomColorByRow((prev) => ({ ...prev, [index]: "" }));
                      }}
                      placeholder="#4B0A6B or Brown"
                      className="min-w-[8rem] flex-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#4B0A6B]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addColorToRow(index, customColorByRow[index] ?? "");
                        setCustomColorByRow((prev) => ({ ...prev, [index]: "" }));
                      }}
                      className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-medium hover:bg-neutral-50"
                    >
                      Add color
                    </button>
                  </div>
                  {row.colors.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {row.colors.map((c, colorIndex) => (
                        <li
                          key={`${c.value}-${colorIndex}`}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-2"
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-neutral-300"
                            style={{
                              backgroundColor: c.value.startsWith("#")
                                ? c.value
                                : COLOR_PRESETS.find(
                                    (p) => p.label.toLowerCase() === c.value.trim().toLowerCase()
                                  )?.value,
                            }}
                          />
                          <span className="min-w-[5rem] flex-1 text-xs font-medium text-neutral-800">
                            {colorDisplayName(c.value)}
                          </span>
                          <label className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600">
                            In stock
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={c.stock}
                              onChange={(e) =>
                                updateColorStock(index, colorIndex, e.target.value)
                              }
                              className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-[#4B0A6B]"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeColorFromRow(index, colorIndex)}
                            className="text-[11px] font-medium text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[11px] text-neutral-500">No colors on this size yet.</p>
                  )}
                </div>
              </li>
            );
          })}
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
      const colors = (d.colors || [])
        .map((c) => ({
          color: c.value.trim(),
          stock: Math.max(0, Number.parseInt(c.stock || "0", 10) || 0),
        }))
        .filter((c) => c.color);
      const unique: { color: string; stock: number }[] = [];
      const seen = new Set<string>();
      for (const c of colors) {
        const key = c.color.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(c);
      }
      const stockFromColors = unique.reduce((sum, c) => sum + c.stock, 0);
      return {
        id: d.id.trim() || slugifyPack(d.label) || `opt-${index + 1}`,
        label: d.label.trim(),
        price: Math.max(0, Number(d.price) || 0),
        stock:
          unique.length > 0
            ? stockFromColors
            : Math.max(0, Number.parseInt(d.stock || "0", 10) || 0),
        ...(maxParsed && maxParsed > 0 ? { maxPerOrder: maxParsed } : {}),
        ...(unique.length ? { colors: unique } : {}),
      };
    });
}

type VariantColorInput = string | { color?: string; stock?: number };

export function variantsToDrafts(
  variants:
    | {
        id: string;
        label: string;
        price: number;
        stock: number;
        maxPerOrder?: number;
        colors?: VariantColorInput[];
      }[]
    | null
    | undefined,
  /** Legacy product-level colors: seed onto sizes that have none. */
  legacyColors?: string[] | null
): PackVariantDraft[] {
  if (!Array.isArray(variants) || !variants.length) return [];
  const fallback = Array.isArray(legacyColors)
    ? legacyColors.map((c) => c.trim()).filter(Boolean)
    : [];
  return variants.map((v) => {
    const own: PackColorDraft[] = [];
    if (Array.isArray(v.colors)) {
      for (const raw of v.colors) {
        if (typeof raw === "string") {
          const value = raw.trim();
          if (!value) continue;
          own.push({ value, stock: "0" });
        } else if (raw && typeof raw === "object") {
          const value = String(raw.color || "").trim();
          if (!value) continue;
          own.push({
            value,
            stock: String(Math.max(0, Math.floor(Number(raw.stock) || 0))),
          });
        }
      }
    }
    const colors =
      own.length > 0
        ? own
        : fallback.map((value) => ({ value, stock: "0" }));
    const stock =
      colors.length > 0 ? String(colorStockSum(colors)) : String(v.stock ?? 0);
    return {
      id: v.id,
      label: v.label,
      price: String(v.price),
      stock,
      maxPerOrder: v.maxPerOrder && v.maxPerOrder > 0 ? String(v.maxPerOrder) : "",
      colors,
    };
  });
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
  return labels.map((label, i) =>
    emptyRow({
      id: slugifyPack(label) || `opt-${label}`,
      label,
      price: defaultPrice || "0",
      stock: String(base + (i < rem ? 1 : 0)),
    })
  );
}
