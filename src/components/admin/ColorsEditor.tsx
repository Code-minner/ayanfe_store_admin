"use client";

type Props = {
  colors: string[];
  onChange: (next: string[]) => void;
};

const PRESETS = [
  { label: "Black", value: "#111111" },
  { label: "White", value: "#FFFFFF" },
  { label: "Gold", value: "#C9A227" },
  { label: "Silver", value: "#C0C0C0" },
  { label: "Pink", value: "#F9A8D4" },
  { label: "Brown", value: "#8B5E3C" },
  { label: "Red", value: "#DC2626" },
  { label: "Blue", value: "#2563EB" },
];

export default function ColorsEditor({ colors, onChange }: Props) {
  const addColor = (value: string) => {
    const next = value.trim();
    if (!next) return;
    if (colors.some((c) => c.toLowerCase() === next.toLowerCase())) return;
    onChange([...colors, next]);
  };

  const removeAt = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-[#FAFAFA] p-4">
      <p className="text-sm font-medium text-neutral-900">Colors (optional)</p>
      <p className="mt-1 text-xs text-neutral-500">
        For products without size options. If you add sizes above, set colors on each size
        instead. Use a hex code or a name (Gold, Brown, Army Green).
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => addColor(p.value)}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium hover:border-[#4B0A6B]"
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-neutral-300"
              style={{ backgroundColor: p.value }}
            />
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          id="custom-color"
          placeholder="#4B0A6B or Brown"
          className="min-w-[10rem] flex-1 rounded-lg border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-[#4B0A6B]"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const input = e.currentTarget;
            addColor(input.value);
            input.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => {
            const input = document.getElementById("custom-color") as HTMLInputElement | null;
            if (!input) return;
            addColor(input.value);
            input.value = "";
          }}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-50"
        >
          Add color
        </button>
      </div>

      {colors.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <li
              key={`${c}-${i}`}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-neutral-300"
                style={{ backgroundColor: c.startsWith("#") ? c : undefined }}
              />
              {c}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">No colors yet. Buyers will not see a color picker.</p>
      )}
    </div>
  );
}
