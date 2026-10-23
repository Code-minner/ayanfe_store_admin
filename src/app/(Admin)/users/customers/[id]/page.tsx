"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/context/AuthContext";
import { apiGetCustomer, type AdminCustomer, type AdminOrder } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";

export default function CustomerProfilePage() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !params.id) return;
    setLoading(true);
    apiGetCustomer(token, params.id)
      .then((data) => {
        setCustomer(data.customer);
        setOrders(data.orders || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load customer");
      })
      .finally(() => setLoading(false));
  }, [token, params.id]);

  return (
    <>
      <TopBar
        breadcrumb={
          <>
            User Management &gt;{" "}
            <Link href="/users/customers" className="hover:text-neutral-800">
              Customers
            </Link>{" "}
            &gt; <span className="font-semibold text-neutral-900">User profile</span>
          </>
        }
      />
      <main className="flex-1 space-y-6 p-6">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : customer ? (
          <>
            <div className="max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-xl font-semibold">User profile</h1>
                <StatusPill status={customer.status} />
              </div>
              <div className="mt-6">
                <span className="relative inline-grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#F3E6F6] text-2xl font-semibold text-[#4B0A6B]">
                  {customer.avatarUrl ? (
                    <Image
                      src={customer.avatarUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    (customer.name[0] || "?").toUpperCase()
                  )}
                </span>
              </div>
              <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-neutral-500">First name</dt>
                  <dd className="mt-1 font-medium">{customer.firstName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Last name</dt>
                  <dd className="mt-1 font-medium">{customer.lastName || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-neutral-500">Email</dt>
                  <dd className="mt-1 font-medium">{customer.email}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-neutral-500">Phone</dt>
                  <dd className="mt-1 font-medium">{customer.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Registered</dt>
                  <dd className="mt-1 font-medium">{formatDate(customer.registeredAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Orders</dt>
                  <dd className="mt-1 font-medium">{customer.orders}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Order history</h2>
              {orders.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">No orders for this customer yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-neutral-500">
                      <tr className="border-b border-neutral-100">
                        <th className="px-3 py-2 font-medium">Invoice</th>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Payment</th>
                        <th className="px-3 py-2 font-medium">Total</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="border-b border-neutral-100 last:border-0">
                          <td className="px-3 py-3">
                            <Link
                              href={`/orders/${o.id}`}
                              className="font-medium text-[#4B0A6B] hover:underline"
                            >
                              {o.invoiceNumber || o.id.slice(-8)}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-neutral-600">{formatDate(o.createdAt)}</td>
                          <td className="px-3 py-3 text-neutral-600">
                            {o.paymentMethod.replace("_", " ")}
                          </td>
                          <td className="px-3 py-3 text-neutral-600">{formatNaira(o.total)}</td>
                          <td className="px-3 py-3">
                            <StatusPill status={o.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
