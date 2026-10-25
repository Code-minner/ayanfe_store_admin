"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import SearchInput from "@/components/ui/SearchInput";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/context/AuthContext";
import PrintPreviewModal from "@/components/admin/PrintPreviewModal";
import { apiFetchPrintOrders, apiGetOrders, apiGetStats, type AdminOrder, type AdminStats } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending_verification", label: "Pending" },
  { key: "on_hold", label: "On hold" },
  { key: "completed", label: "Completed" },
  { key: "shipped", label: "Shipped" },
  { key: "cancelled", label: "Cancelled" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthRangeIso(year: number, fromMonth: number, toMonth: number) {
  const from = new Date(Date.UTC(year, fromMonth, 1));
  const to = new Date(Date.UTC(year, toMonth + 1, 0, 23, 59, 59, 999));
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function OrdersPage() {
  const { token, can } = useAuth();
  const canLoadStats = can("dashboard");
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printYear, setPrintYear] = useState(new Date().getFullYear());
  const [fromMonth, setFromMonth] = useState(2); // March
  const [toMonth, setToMonth] = useState(9); // October
  const [printType, setPrintType] = useState<"invoice" | "waybill">("invoice");
  const [printMethod, setPrintMethod] = useState<
    "all" | "local_pickup" | "waybill" | "stockpile" | "lagos_delivery"
  >("all");
  const [printing, setPrinting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewTitle, setPreviewTitle] = useState("Print preview");

  const deliveryLabel = (method?: string) => {
    if (method === "local_pickup") return "Local pickup";
    if (method === "waybill") return "Waybill";
    if (method === "stockpile") return "Stockpile";
    if (method === "lagos_delivery") return "Lagos delivery";
    return method ? method.replace(/_/g, " ") : "-";
  };

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
      orders.filter((o) =>
        ["paid", "processing", "shipped", "completed"].includes(o.status)
      ).length,
    canceled:
      summary?.ordersCanceled ??
      orders.filter((o) => ["cancelled", "failed"].includes(o.status)).length,
  };

  const printDocs = async () => {
    if (!token) return;
    if (fromMonth > toMonth) {
      setError("Start month must be before end month");
      return;
    }
    setPrinting(true);
    setError("");
    try {
      const range = monthRangeIso(printYear, fromMonth, toMonth);
      const method =
        printType === "waybill" && printMethod === "all" ? "waybill" : printMethod;
      const html = await apiFetchPrintOrders(token, {
        type: printType,
        method,
        ...range,
      });
      setPreviewTitle(printType === "waybill" ? "Waybill preview" : "Invoice preview");
      setPreviewHtml(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open print view");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <>
      <TopBar breadcrumb={<span className="font-semibold text-neutral-900">Orders</span>} />
      <AdminMain className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-neutral-200 bg-white p-3">
            <label className="text-xs font-medium text-neutral-600">
              Doc
              <select
                value={printType}
                onChange={(e) => {
                  const next = e.target.value as "invoice" | "waybill";
                  setPrintType(next);
                  if (next === "waybill") setPrintMethod("waybill");
                }}
                className="mt-1 block rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              >
                <option value="invoice">Invoices</option>
                <option value="waybill">Waybills</option>
              </select>
            </label>
            <label className="text-xs font-medium text-neutral-600">
              Delivery
              <select
                value={printMethod}
                onChange={(e) =>
                  setPrintMethod(
                    e.target.value as
                      | "all"
                      | "local_pickup"
                      | "waybill"
                      | "stockpile"
                      | "lagos_delivery"
                  )
                }
                className="mt-1 block rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              >
                <option value="all">All methods</option>
                <option value="local_pickup">Local pickup</option>
                <option value="waybill">Waybill (outside Lagos)</option>
                <option value="stockpile">Stockpile</option>
                <option value="lagos_delivery">Lagos delivery</option>
              </select>
            </label>
            <label className="text-xs font-medium text-neutral-600">
              Year
              <input
                type="number"
                value={printYear}
                onChange={(e) => setPrintYear(Number(e.target.value) || printYear)}
                className="mt-1 block w-24 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-neutral-600">
              From
              <select
                value={fromMonth}
                onChange={(e) => setFromMonth(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-neutral-600">
              To
              <select
                value={toMonth}
                onChange={(e) => setToMonth(Number(e.target.value))}
                className="mt-1 block rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={printing || !token}
              onClick={() => void printDocs()}
              className="rounded-xl bg-[#4B0A6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a0854] disabled:opacity-50"
            >
              {printing
                ? "Loading..."
                : printType === "waybill"
                  ? "Preview waybills"
                  : "Preview invoices"}
            </button>
          </div>
        </div>
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
                    <th className="px-3 py-3 font-medium">Delivery</th>
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
                        <td className="px-3 py-3 text-neutral-600">
                          {deliveryLabel(o.shipping?.method)}
                        </td>
                        <td className="px-3 py-3 text-neutral-600">{formatNaira(o.total)}</td>
                        <td className="px-3 py-3"><StatusPill status={o.status} /></td>
                        <td className="px-3 py-3 text-right">
                          <Link href={`/orders/${o.id}`} className="rounded-lg px-2 py-1 text-neutral-500 hover:bg-neutral-50">...</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminMain>
      <PrintPreviewModal
        open={Boolean(previewHtml)}
        title={previewTitle}
        html={previewHtml}
        onClose={() => setPreviewHtml("")}
      />
    </>
  );
}