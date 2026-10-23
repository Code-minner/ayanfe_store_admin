"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/admin/TopBar";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/context/AuthContext";
import { apiGetOrder, apiUpdateOrderStatus, type AdminOrder } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    void apiGetOrder(token, params.id)
      .then((d) => setOrder(d.order))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [token, params.id]);

  const updateStatus = async (status: string) => {
    if (!token || !order) return;
    setSaving(true);
    setMenuOpen(false);
    try {
      const data = await apiUpdateOrderStatus(token, order.id, status);
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (!order) {
    return (
      <>
        <TopBar breadcrumb={<>Orders &gt; <span className="font-semibold text-neutral-900">Order Details</span></>} />
        <main className="p-6 text-sm text-neutral-500">{error || "Loading order..."}</main>
      </>
    );
  }

  return (
    <>
      <TopBar breadcrumb={<>Orders &gt; <span className="font-semibold text-neutral-900">Order Details</span></>} />
      <main className="flex-1 space-y-4 p-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">#{order.invoiceNumber || order.id.slice(-7)}</p>
              <p className="mt-1 text-sm font-medium text-[#4B0A6B]">Ayanfe Store</p>
            </div>
            <StatusPill status={order.status} />
          </div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-neutral-500">Order Created at</p><p className="mt-1 font-medium">{formatDate(order.createdAt)}</p></div>
            <div><p className="text-neutral-500">Name</p><p className="mt-1 font-medium">{order.shipping?.fullName || "—"}</p></div>
            <div><p className="text-neutral-500">Email</p><p className="mt-1 font-medium">{order.email}</p></div>
            <div><p className="text-neutral-500">Contact</p><p className="mt-1 font-medium">{order.shipping?.phone || "—"}</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Products</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="relative h-14 w-14 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <Image src={item.image} alt="" fill className="object-contain p-1" sizes="56px" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-neutral-500">Qty {item.quantity}</p>
                </div>
                <p className="font-medium">{formatNaira(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-neutral-100 pt-4 text-sm">
            <p className="flex items-center gap-2"><span className="text-neutral-500">Status:</span> <StatusPill status={order.status === "paid" || order.status === "processing" || order.status === "shipped" ? "paid" : order.status} /></p>
            <p className="mt-2"><span className="text-neutral-500">Payment Method:</span> {order.paymentMethod.replace("_", " ")}</p>
            <p className="mt-2"><span className="text-neutral-500">Sub Total:</span> {order.items.length} items ({formatNaira(order.total)})</p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Approve Payment</h2>
            <div className="relative">
              <button type="button" className="rounded-lg p-2 hover:bg-neutral-50" onClick={() => setMenuOpen((v) => !v)} disabled={saving}>⋮</button>
              {menuOpen && (
                <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                  <button type="button" className="block w-full px-4 py-2 text-left hover:bg-neutral-50" onClick={() => void updateStatus("paid")}>Confirm</button>
                  <button type="button" className="block w-full px-4 py-2 text-left hover:bg-neutral-50" onClick={() => void updateStatus("failed")}>Failed</button>
                </div>
              )}
            </div>
          </div>
          {order.receiptUrl && (
            <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-[#4B0A6B] underline">
              View transfer receipt
            </a>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </main>
    </>
  );
}