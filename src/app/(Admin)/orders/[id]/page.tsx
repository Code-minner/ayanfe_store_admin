"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/admin/TopBar";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/context/AuthContext";
import { apiGetOrder, apiUpdateOrderStatus, type AdminOrder } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";

function shippingLabel(method?: string) {
  if (method === "local_pickup") return "Local pickup";
  if (method === "waybill") return "Waybill";
  if (method === "stockpile") return "Stockpile";
  return method || "—";
}

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

  const ship = order.shipping;
  const customerName =
    ship?.fullName ||
    [ship?.firstName, ship?.lastName].filter(Boolean).join(" ").trim() ||
    "—";
  const addressLine = [ship?.address, ship?.city, ship?.state, ship?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <TopBar breadcrumb={<>Orders &gt; <span className="font-semibold text-neutral-900">Order Details</span></>} />
      <main className="flex-1 space-y-4 p-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">#{order.invoiceNumber || order.id.slice(-7)}</p>
              <p className="mt-1 text-sm font-medium text-[#4B0A6B]">Attog Store</p>
            </div>
            <StatusPill status={order.status} />
          </div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-neutral-500">Order created</p>
              <p className="mt-1 font-medium">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Name</p>
              <p className="mt-1 font-medium">{customerName}</p>
            </div>
            <div>
              <p className="text-neutral-500">Email</p>
              <p className="mt-1 font-medium">{order.email}</p>
            </div>
            <div>
              <p className="text-neutral-500">Phone</p>
              <p className="mt-1 font-medium">{ship?.phone || "—"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Shipment & delivery</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-neutral-500">Method</p>
              <p className="mt-1 font-medium">{shippingLabel(ship?.method)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Shipping fee</p>
              <p className="mt-1 font-medium">
                {ship?.shippingFee && ship.shippingFee > 0
                  ? formatNaira(ship.shippingFee)
                  : "Free / included"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-neutral-500">Address</p>
              <p className="mt-1 font-medium">{addressLine || "—"}</p>
            </div>
            {order.customerNote && (
              <div className="sm:col-span-2">
                <p className="text-neutral-500">Customer note</p>
                <p className="mt-1 whitespace-pre-wrap font-medium">{order.customerNote}</p>
              </div>
            )}
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
          <div className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            <p className="flex items-center gap-2">
              <span className="text-neutral-500">Status:</span>{" "}
              <StatusPill
                status={
                  order.status === "paid" ||
                  order.status === "processing" ||
                  order.status === "shipped"
                    ? "paid"
                    : order.status
                }
              />
            </p>
            <p>
              <span className="text-neutral-500">Payment method:</span>{" "}
              {order.paymentMethod.replace(/_/g, " ")}
            </p>
            <p>
              <span className="text-neutral-500">Subtotal:</span> {formatNaira(order.subtotal)}
            </p>
            <p>
              <span className="text-neutral-500">Fees (service + shipping):</span>{" "}
              {formatNaira(order.fee)}
            </p>
            <p className="font-semibold">
              <span className="text-neutral-500 font-normal">Total:</span> {formatNaira(order.total)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Approve payment</h2>
            <div className="relative">
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-neutral-50"
                onClick={() => setMenuOpen((v) => !v)}
                disabled={saving}
              >
                ⋮
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left hover:bg-neutral-50"
                    onClick={() => void updateStatus("paid")}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left hover:bg-neutral-50"
                    onClick={() => void updateStatus("failed")}
                  >
                    Failed
                  </button>
                </div>
              )}
            </div>
          </div>
          {order.receiptUrl && (
            <a
              href={order.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-medium text-[#4B0A6B] underline"
            >
              View transfer receipt
            </a>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </main>
    </>
  );
}
