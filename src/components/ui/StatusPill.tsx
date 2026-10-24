const STYLES: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Suspended: "bg-red-50 text-red-600",
  Inactive: "bg-neutral-100 text-neutral-600",
  Pending: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  pending_verification: "bg-amber-50 text-amber-700",
  on_hold: "bg-orange-50 text-orange-800",
  Successful: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  Confirmed: "bg-emerald-50 text-emerald-700",
  Processing: "bg-orange-50 text-orange-700",
  processing: "bg-orange-50 text-orange-700",
  shipped: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-800",
  Delivered: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-neutral-100 text-neutral-600",
  Canceled: "bg-neutral-100 text-neutral-600",
  Failed: "bg-red-50 text-red-600",
  failed: "bg-red-50 text-red-600",
  Overdue: "bg-orange-50 text-orange-700",
  Approved: "bg-emerald-50 text-emerald-700",
};

export default function StatusPill({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        STYLES[status] || "bg-neutral-100 text-neutral-600"
      }`}
    >
      {label}
    </span>
  );
}
