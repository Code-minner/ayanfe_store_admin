export function formatNaira(value: number) {
  return `\u20A6${value.toLocaleString("en-NG")}`;
}

const KNOWN_COLOR_NAMES: Record<string, string> = {
  "#111111": "Black",
  "#000000": "Black",
  "#ffffff": "White",
  "#c9a227": "Gold",
  "#c0c0c0": "Silver",
  "#f9a8d4": "Pink",
  "#8b5e3c": "Brown",
  "#dc2626": "Red",
  "#2563eb": "Blue",
  "#4b0a6b": "Purple",
};

/** Readable color for order/invoice UI (maps known hex to names). */
export function colorDisplayName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Color";
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  return KNOWN_COLOR_NAMES[trimmed.toLowerCase()] ?? trimmed.toUpperCase();
}

export function formatDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/** Month-over-month change label from API `pctChange` (null = no prior month baseline). */
export function formatMomChange(pct: number | null | undefined): {
  text: string;
  up: boolean | null;
} {
  if (pct === null || pct === undefined) {
    return { text: "No prior month data", up: null };
  }
  if (pct === 0) return { text: "Same as last month", up: null };
  const up = pct > 0;
  return {
    text: `${up ? "\u2191" : "\u2193"} ${Math.abs(pct)}% vs last month`,
    up,
  };
}
