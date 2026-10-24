"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import StatusPill from "@/components/ui/StatusPill";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { apiGetOrder, apiPrintOrders, apiUpdateOrderStatus, type AdminOrder } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";

const STATUS_ACTIONS = [
  { value: "on_hold", label: "On hold" },
  { value: "paid", label: "Paid / confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function shippingLabel(method?: string) {
  if (method === "local_pickup") return "Local pickup (\u20A650)";
  if (method === "waybill") return "Waybill outside Lagos (\u20A6500)";
  if (method === "stockpile") return "Stockpile (\u20A650)";
  if (method === "lagos_delivery") return "Lagos delivery (\u20A650)";
  return method || "-";
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
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
    setError("");
    try {
      const data = await apiUpdateOrderStatus(token, order.id, status);
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const printInvoice = async () => {
    if (!token || !order) return;
    setPrinting(true);
    setError("");
    try {
      await apiPrintOrders(token, { type: "invoice", ids: [order.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Print failed");
    } finally {
      setPrinting(false);
    }
  };

  if (!order) {
    return (
      <>
        <TopBar breadcrumb={<>Orders &gt; <span className="font-semibold text-neutral-900">Order Details</span></>} />
        <AdminMain className="text-sm text-neutral-500">{error || "Loading order..."}</AdminMain>
      </>
    );
  }

  const ship = order.shipping;
  const customerName =
    ship?.fullName ||
    [ship?.firstName, ship?.lastName].filter(Boolean).join(" ").trim() ||
    "-";
  const addressLine = [ship?.address, ship?.city, ship?.state, ship?.country]
    .filter(Boolean)
    .join(", ");
  const shippingFee = ship?.shippingFee ?? 0;

  return (
    <>
      <TopBar breadcrumb={<>Orders &gt; <span className="font-semibold text-neutral-900">Order Details</span></>} />
      <AdminMain className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              #{order.invoiceNumber || order.id.slice(-7)}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={printing}
              onClick={() => void printInvoice()}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              {printing ? "Opening..." : "Print invoice"}
            </button>
            <div className="relative">
              <button
                type="button"
                className="rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3a0854] disabled:opacity-50"
                onClick={() => setMenuOpen((v) => !v)}
                disabled={saving}
              >
                Set order status
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-10 mt-1 w-48 rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                  {STATUS_ACTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50"
                      onClick={() => void updateStatus(s.value)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-500">Customer</p>
              <p className="mt-1 font-semibold">{customerName}</p>
              <p className="text-sm text-neutral-600">{order.email}</p>
              {ship?.phone ? <p className="text-sm text-neutral-600">{ship.phone}</p> : null}
            </div>
            <StatusPill status={order.status} />
          </div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-neutral-500">Payment</p>
              <p className="mt-1 font-medium capitalize">{order.paymentMethod.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-neutral-500">Delivery</p>
              <p className="mt-1 font-medium">{shippingLabel(ship?.method)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Shipping fee</p>
              <p className="mt-1 font-medium">{formatNaira(shippingFee)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Total</p>
              <p className="mt-1 font-medium">{formatNaira(order.total)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Shipment & delivery</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-neutral-500">Address</p>
              <p className="mt-1 font-medium">{addressLine || "-"}</p>
            </div>
            {ship?.method === "stockpile" ? (
              <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <strong>Stockpile disclaimer:</strong> Stockpiling should not exceed three weeks.
                Goods left longer are at the owner&apos;s risk. Fee \u20A650.
              </div>
            ) : null}
            {ship?.method === "lagos_delivery" ? (
              <div className="sm:col-span-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Lagos delivery: base \u20A650. Our rider will contact the customer for any extra charges.
              </div>
            ) : null}
            {order.customerNote ? (
              <div className="sm:col-span-2">
                <p className="text-neutral-500">Customer note</p>
                <p className="mt-1 whitespace-pre-wrap font-medium">{order.customerNote}</p>
              </div>
            ) : null}
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
                  <p className="text-sm text-neutral-500">
                    {[
                      item.brand ? `Brand: ${item.brand}` : null,
                      item.color ? `Color: ${item.color}` : null,
                      item.size ? `Size: ${item.size}` : null,
                      `Qty ${item.quantity}`,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </p>
                </div>
                <p className="font-medium">{formatNaira(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            <p>
              <span className="text-neutral-500">Subtotal:</span> {formatNaira(order.subtotal)}
            </p>
            <p>
              <span className="text-neutral-500">Delivery:</span>{" "}
              {shippingFee > 0 ? formatNaira(shippingFee) : "Free"}
            </p>
            <p className="font-semibold">
              <span className="font-normal text-neutral-500">Total:</span> {formatNaira(order.total)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Payment proof</h2>
          {order.receiptUrl ? (
            <button
              type="button"
              onClick={() => setReceiptOpen(true)}
              className="mt-3 inline-flex rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3a0854]"
            >
              View transfer receipt
            </button>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">No receipt uploaded.</p>
          )}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>

        <Modal
          open={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          title="Transfer receipt"
          wide
        >
          {order.receiptUrl ? (
            <div className="space-y-4">
              <div className="relative mx-auto min-h-[320px] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.receiptUrl}
                  alt="Payment receipt"
                  className="mx-auto max-h-[70vh] w-auto max-w-full object-contain"
                />
              </div>
              <p className="text-xs text-neutral-500">
                Shown inside admin. Open in a new tab only if you need to download.
              </p>
              <a
                href={order.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm font-medium text-[#4B0A6B] underline"
              >
                Download / open file
              </a>
            </div>
          ) : null}
        </Modal>
      </AdminMain>
    </>
  );
}
