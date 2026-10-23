"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import SearchInput from "@/components/ui/SearchInput";
import StatusPill from "@/components/ui/StatusPill";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { apiGetOrders, apiUpdateOrderStatus, type AdminOrder } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";

const TABS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Confirmed" },
  { key: "pending_verification", label: "Processing" },
  { key: "failed", label: "Failed" },
];

export default function PaymentsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!token) return;
    void apiGetOrders(token).then((d) => setOrders(d.orders || [])).catch(() => setOrders([]));
  }, [token]);

  const bankOrders = useMemo(
    () => orders.filter((o) => o.paymentMethod === "bank_transfer" || o.receiptUrl),
    [orders]
  );

  const rows = useMemo(() => {
    let list = bankOrders;
    if (tab !== "all") list = list.filter((o) => o.status === tab);
    if (q) {
      list = list.filter(
        (o) => o.email.toLowerCase().includes(q.toLowerCase()) || o.id.toLowerCase().includes(q.toLowerCase())
      );
    }
    return list;
  }, [bankOrders, tab, q]);

  const total = bankOrders.reduce((s, o) => s + o.total, 0);
  const confirmed = bankOrders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total, 0);
  const pending = bankOrders.filter((o) => o.status.includes("pending")).reduce((s, o) => s + o.total, 0);

  const setStatus = async (order: AdminOrder, status: string) => {
    if (!token) return;
    setMenuFor(null);
    setActing(true);
    setActionError("");
    try {
      const data = await apiUpdateOrderStatus(token, order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
      if (detail?.id === order.id) setDetail(data.order);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update payment");
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <TopBar breadcrumb={<span className="font-semibold text-neutral-900">Payments</span>} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Payments</h1>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">
            Download
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Total Funds Made</p>
            <p className="mt-2 text-2xl font-semibold">{formatNaira(confirmed || total)}</p>
            <p className="mt-2 text-xs font-medium text-red-500">↓ 1% than last month</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Total Inflow</p>
            <p className="mt-2 text-2xl font-semibold">{formatNaira(total)}</p>
            <p className="mt-2 text-xs font-medium text-emerald-600">↑ 40% than last month</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Pending verification</p>
            <p className="mt-2 text-2xl font-semibold">{formatNaira(pending)}</p>
            <p className="mt-2 text-xs font-medium text-emerald-600">↑ 40% than last month</p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Payment</h2>
            <button type="button" className="text-sm font-medium text-[#4B0A6B]">View all</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 border-b border-neutral-100">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`pb-3 text-sm font-medium ${tab === t.key ? "border-b-2 border-[#4B0A6B]" : "text-neutral-500"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <SearchInput value={q} onChange={setQ} />
            <button type="button" className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium">Filters</button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr className="border-b border-neutral-100">
                  <th className="px-3 py-3 font-medium">Payee</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Transaction ID</th>
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
                          {o.email[0]?.toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium">{o.shipping?.fullName || "Customer"}</p>
                          <p className="text-xs text-neutral-500">{o.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-neutral-600">{formatDate(o.createdAt)}</td>
                    <td className="px-3 py-3 text-neutral-600">{o.id.slice(-12)}</td>
                    <td className="px-3 py-3 text-neutral-600">{formatNaira(o.total)}</td>
                    <td className="px-3 py-3"><StatusPill status={o.status} /></td>
                    <td className="relative px-3 py-3 text-right">
                      <button type="button" className="rounded-lg p-2 hover:bg-neutral-50" onClick={() => setMenuFor(menuFor === o.id ? null : o.id)}>⋮</button>
                      {menuFor === o.id && (
                        <div className="absolute right-3 z-10 mt-1 w-40 rounded-xl border border-neutral-200 bg-white py-2 text-left shadow-lg">
                          <button type="button" className="block w-full px-4 py-2 text-left hover:bg-neutral-50" onClick={() => { setDetail(o); setMenuFor(null); }}>View details</button>
                          <button type="button" className="block w-full px-4 py-2 text-left hover:bg-neutral-50" onClick={() => void setStatus(o, "paid")}>Approved</button>
                          <button type="button" className="block w-full px-4 py-2 text-left hover:bg-neutral-50" onClick={() => void setStatus(o, "failed")}>Failed</button>
                          <button type="button" className="block w-full px-4 py-2 text-left text-red-600 hover:bg-neutral-50">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="mt-6 text-sm text-neutral-500">No bank-transfer payments yet.</p>}
          </div>
        </div>
      </main>

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
                <strong>{detail.paymentMethod.replace("_", " ")}</strong>
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
                <p className="mt-2 text-sm text-neutral-500">No receipt uploaded.</p>
              )}
            </div>
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
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
                disabled={acting || detail.status === "paid"}
                onClick={() => void setStatus(detail, "paid")}
                className="rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {acting ? "Saving…" : detail.status === "paid" ? "Already approved" : "Confirm payment"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}