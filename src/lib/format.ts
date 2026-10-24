export function formatNaira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
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
    text: `${up ? "↑" : "↓"} ${Math.abs(pct)}% vs last month`,
    up,
  };
}
