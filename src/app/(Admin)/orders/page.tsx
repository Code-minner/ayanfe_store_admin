"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import SearchInput from "@/components/ui/SearchInput";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/context/AuthContext";
import { apiGetOrders, apiGetStats, type AdminOrder, type AdminStats } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending_verification", label: "Pending" },
  { key: "shipped", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const { token, can } = useAuth();
  const canLoadStats = can("dashboard");
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const [data, statsRes] = await Promise.all([
          apiGetOrders(token, tab === "all" ? undefined : tab),
          canLoadStats ? apiGetStats(token).catch(() => null) : Promise.resolve(null),
        ]);
        setOrders(data.orders || []);
        if (statsRes) setSummary(statsRes.stats);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load orders");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token, tab, canLoadStats]);

  const rows = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q.toLowerCase()) ||
          o.email.toLowerCase().includes(q.toLowerCase()) ||
          o.items.some((i) => i.name.toLowerCase().includes(q.toLowerCase()))
      ),
    [orders, q]
  );

  const stats = {
    all: summary?.ordersTotal ?? orders.length,
    pending:
      summary?.ordersPending ??
      orders.filter((o) => o.status.includes("pending")).length,
    completed:
      summary?.ordersCompleted ??
      orders.filter((o) => ["paid", "processing", "shipped"].includes(o.status)).length,
    canceled:
      summary?.ordersCanceled ??
      orders.filter((o) => ["cancelled", "failed"].includes(o.status)).length,
  };

  return (
    <>
      <TopBar breadcrumb={<span className="font-semibold text-neutral-900">Orders</span>} />
      <main className="flex-1 space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["All orders", stats.all],
            ["Pending orders", stats.pending],
            ["Completed orders", stats.completed],
            ["Canceled / failed", stats.canceled],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-neutral-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value as number}</p>
              <p className="mt-2 text-xs font-medium text-neutral-500">From live orders</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-6 border-b border-neutral-100">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`pb-3 text-sm font-medium ${tab === t.key ? "border-b-2 border-[#4B0A6B] text-neutral-900" : "text-neutral-500"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <SearchInput value={q} onChange={setQ} />
            <button type="button" className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium">Filters</button>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="mt-8 text-sm text-neutral-500">Loading orders...</p>
          ) : rows.length === 0 ? (
            <p className="mt-8 text-sm text-neutral-500">No orders yet.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-neutral-500">
                  <tr className="border-b border-neutral-100">
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Price</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const first = o.items[0];
                    return (
                      <tr key={o.id} className="border-b border-neutral-100 last:border-0">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <span className="relative h-10 w-10 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                              {first?.image ? <Image src={first.image} alt="" fill className="object-contain p-1" sizes="40px" /> : null}
                            </span>
                            <div>
                              <p className="font-medium">{first?.name || "Order"}</p>
                              <p className="text-xs text-neutral-500">{o.invoiceNumber || o.id.slice(-8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-neutral-600">{formatDate(o.createdAt)}</td>
                        <td className="px-3 py-3 text-neutral-600">{o.email}</td>
                        <td className="px-3 py-3 text-neutral-600">{formatNaira(o.total)}</td>
                        <td className="px-3 py-3"><StatusPill status={o.status} /></td>
                        <td className="px-3 py-3 text-right">
                          <Link href={`/orders/${o.id}`} className="rounded-lg px-2 py-1 text-neutral-500 hover:bg-neutral-50">⋮</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}