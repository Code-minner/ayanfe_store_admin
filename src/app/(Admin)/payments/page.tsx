"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import RequirePermission from "@/components/admin/RequirePermission";
import SearchInput from "@/components/ui/SearchInput";
import StatusPill from "@/components/ui/StatusPill";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  apiGetOrders,
  apiGetStats,
  apiUpdateOrderStatus,
  type AdminOrder,
  type AdminStats,
} from "@/lib/api";
import { formatDate, formatMomChange, formatNaira } from "@/lib/format";

const TABS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Confirmed" },
  { key: "pending_verification", label: "Awaiting verification" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
];

const METHOD_FILTERS = [
  { key: "all", label: "All methods" },
  { key: "paystack", label: "Paystack" },
  { key: "bank_transfer", label: "Bank transfer" },
] as const;

const PAID_STATUSES = new Set(["paid", "processing", "shipped"]);

function methodLabel(method: string) {
  return method.replace(/_/g, " ");
}

function downloadCsv(rows: AdminOrder[]) {
  const header = ["id", "email", "name", "date", "method", "status", "total", "invoice"];
  const lines = [
    header.join(","),
    ...rows.map((o) =>
      [
        o.id,
        o.email,
        o.shipping?.fullName || "",
        o.createdAt,
        o.paymentMethod,
        o.status,
        o.total,
        o.invoiceNumber || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ayanfe-payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PaymentsPage() {
  const { token, can } = useAuth();
  const showTotals = can("payment_totals");
  const [tab, setTab] = useState("all");
  const [method, setMethod] = useState<(typeof METHOD_FILTERS)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [ordersRes, statsRes] = await Promise.all([
          apiGetOrders(token),
          showTotals ? apiGetStats(token).catch(() => null) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setOrders(ordersRes.orders || []);
        setStats(statsRes?.stats ?? null);
      } catch (err) {
        if (!cancelled) {
          setOrders([]);
          setError(err instanceof Error ? err.message : "Could not load payments");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, showTotals]);

  const rows = useMemo(() => {
    let list = orders;
    if (method !== "all") list = list.filter((o) => o.paymentMethod === method);
    if (tab === "paid") list = list.filter((o) => PAID_STATUSES.has(o.status));
    else if (tab !== "all") list = list.filter((o) => o.status === tab);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.email.toLowerCase().includes(needle) ||
          o.id.toLowerCase().includes(needle) ||
          (o.invoiceNumber || "").toLowerCase().includes(needle) ||
          (o.shipping?.fullName || "").toLowerCase().includes(needle)
      );
    }
    return list;
  }, [orders, tab, method, q]);

  const confirmed = formatMomChange(stats?.revenueConfirmedChangePct);
  const inflow = formatMomChange(stats?.revenueInflowChangePct);
  const pending = formatMomChange(stats?.revenuePendingChangePct);

  const setStatus = async (order: AdminOrder, status: string) => {
    if (!token) return;
    setMenuFor(null);
    setActing(true);
    setActionError("");
    try {
      const data = await apiUpdateOrderStatus(token, order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
      if (detail?.id === order.id) setDetail(data.order);
      if (showTotals && token) {
        const refreshed = await apiGetStats(token).catch(() => null);
        if (refreshed) setStats(refreshed.stats);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update payment");
    } finally {
      setActing(false);
    }
  };

  return (
    <RequirePermission permission="payments">
      <TopBar breadcrumb={<span className="font-semibold text-neutral-900">Payments</span>} />
      <AdminMain className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Payments</h1>
          <button
            type="button"
            onClick={() => downloadCsv(rows)}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>

        {showTotals ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-neutral-500">Confirmed revenue</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNaira(stats?.revenueConfirmed ?? 0)}
              </p>
              <p
                className={`mt-2 text-xs font-medium ${
                  confirmed.up === true
                    ? "text-emerald-600"
                    : confirmed.up === false
                      ? "text-red-500"
                      : "text-neutral-500"
                }`}
              >
                {confirmed.text}
                {stats ? ` · ${stats.paidCount} paid orders` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-neutral-500">Total inflow (all statuses)</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNaira(stats?.revenueInflow ?? 0)}
              </p>
              <p
                className={`mt-2 text-xs font-medium ${
                  inflow.up === true
                    ? "text-emerald-600"
                    : inflow.up === false
                      ? "text-red-500"
                      : "text-neutral-500"
                }`}
              >
                {inflow.text}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-neutral-500">Pending verification</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNaira(stats?.revenuePending ?? 0)}
              </p>
              <p
                className={`mt-2 text-xs font-medium ${
                  pending.up === true
                    ? "text-emerald-600"
                    : pending.up === false
                      ? "text-red-500"
                      : "text-neutral-500"
                }`}
              >
                {pending.text}
                {stats ? ` · ${stats.pendingPayCount} orders` : ""}
              </p>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Money totals are hidden for Customer Care. You can still verify individual payments below.
          </p>
        )}

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Transactions</h2>
            <p className="text-sm text-neutral-500">
              {loading ? "Loading…" : `${rows.length} shown`}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 border-b border-neutral-100">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`pb-3 text-sm font-medium ${
                  tab === t.key ? "border-b-2 border-[#4B0A6B]" : "text-neutral-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search email, name, invoice, id…"
            />
            <div className="flex flex-wrap gap-2">
              {METHOD_FILTERS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    method === m.key
                      ? "border-[#4B0A6B] bg-[#F3E6F6] text-[#4B0A6B]"
                      : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr className="border-b border-neutral-100">
                  <th className="px-3 py-3 font-medium">Payee</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Method</th>
                  <th className="px-3 py-3 font-medium">Reference</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F3E6F6] text-sm font-semibold text-[#4B0A6B]">
                          {(o.shipping?.fullName || o.email)[0]?.toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium">{o.shipping?.fullName || "Customer"}</p>
                          <p className="text-xs text-neutral-500">{o.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-neutral-600">{formatDate(o.createdAt)}</td>
                    <td className="px-3 py-3 capitalize text-neutral-600">
                      {methodLabel(o.paymentMethod)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-neutral-600">
                      {o.invoiceNumber || o.id.slice(-12)}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">{formatNaira(o.total)}</td>
                    <td className="px-3 py-3">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="relative px-3 py-3 text-right">
                      <button
                        type="button"
                        className="rounded-lg p-2 hover:bg-neutral-50"
                        onClick={() => setMenuFor(menuFor === o.id ? null : o.id)}
                      >
                        ⋮
                      </button>
                      {menuFor === o.id && (
                        <div className="absolute right-3 z-10 mt-1 w-44 rounded-xl border border-neutral-200 bg-white py-2 text-left shadow-lg">
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left hover:bg-neutral-50"
                            onClick={() => {
                              setDetail(o);
                              setMenuFor(null);
                            }}
                          >
                            View details
                          </button>
                          {o.paymentMethod === "bank_transfer" || o.receiptUrl ? (
                            <>
                              <button
                                type="button"
                                className="block w-full px-4 py-2 text-left hover:bg-neutral-50"
                                onClick={() => void setStatus(o, "paid")}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="block w-full px-4 py-2 text-left hover:bg-neutral-50"
                                onClick={() => void setStatus(o, "failed")}
                              >
                                Mark failed
                              </button>
                            </>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && rows.length === 0 && (
              <p className="mt-6 text-sm text-neutral-500">No payments match these filters.</p>
            )}
          </div>
        </div>
      </AdminMain>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Payment details" wide>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-500">
                {detail.invoiceNumber || detail.id} · {detail.email}
              </p>
              <StatusPill status={detail.status} />
            </div>
            <div className="text-sm">
              <p>
                <span className="text-neutral-500">Amount:</span>{" "}
                <strong>{formatNaira(detail.total)}</strong>
              </p>
              <p className="mt-2">
                <span className="text-neutral-500">Date:</span>{" "}
                <strong>{formatDate(detail.createdAt)}</strong>
              </p>
              <p className="mt-2">
                <span className="text-neutral-500">Method:</span>{" "}
                <strong className="capitalize">{methodLabel(detail.paymentMethod)}</strong>
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Products</p>
              <ul className="mt-2 space-y-2">
                {detail.items.map((item, i) => (
                  <li
                    key={`${item.name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">Payment receipt</p>
              {detail.receiptUrl ? (
                <a
                  href={detail.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="relative mt-3 block overflow-hidden rounded-xl border border-neutral-200"
                >
                  <Image
                    src={detail.receiptUrl}
                    alt="Receipt"
                    width={480}
                    height={320}
                    className="h-auto w-full object-cover"
                  />
                </a>
              ) : (
                <p className="mt-2 text-sm text-neutral-500">
                  {detail.paymentMethod === "paystack"
                    ? "Paid via Paystack (no receipt upload)."
                    : "No receipt uploaded."}
                </p>
              )}
            </div>
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
            {(detail.paymentMethod === "bank_transfer" || detail.receiptUrl) && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void setStatus(detail, "failed")}
                  className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  Mark failed
                </button>
                <button
                  type="button"
                  disabled={acting || PAID_STATUSES.has(detail.status)}
                  onClick={() => void setStatus(detail, "paid")}
                  className="rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {acting
                    ? "Saving…"
                    : PAID_STATUSES.has(detail.status)
                      ? "Already confirmed"
                      : "Confirm payment"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </RequirePermission>
  );
}
