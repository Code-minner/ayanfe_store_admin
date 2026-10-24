"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import SearchInput from "@/components/ui/SearchInput";
import StatusPill from "@/components/ui/StatusPill";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  apiGetCustomers,
  apiSetCustomerStatus,
  type AdminCustomer,
} from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function CustomersPage() {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminCustomer | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiGetCustomers(token, { q, status });
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, q ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, q, status]);

  const rows = useMemo(() => customers, [customers]);

  const confirmSuspend = async () => {
    if (!token || !suspendTarget) return;
    setBusy(true);
    try {
      const nextActive = suspendTarget.status === "Active" ? false : true;
      const data = await apiSetCustomerStatus(token, suspendTarget.id, nextActive);
      setCustomers((prev) =>
        prev.map((c) => (c.id === data.customer.id ? data.customer : c))
      );
      setSuspendTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update customer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar
        breadcrumb={
          <>
            User Management &gt; <span className="font-semibold text-neutral-900">Customers</span>
          </>
        }
      />
      <AdminMain>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchInput value={q} onChange={setQ} />
            <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
              {(
                [
                  ["all", "All"],
                  ["active", "Active"],
                  ["inactive", "Suspended"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    status === key
                      ? "bg-white text-[#4B0A6B] shadow-sm"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr className="border-b border-neutral-100">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Reg. date</th>
                  <th className="px-3 py-3 font-medium">Phone number</th>
                  <th className="px-3 py-3 font-medium">Orders</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-neutral-500">
                      Loading customers...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-neutral-500">
                      No customers found yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#F3E6F6] text-sm font-semibold text-[#4B0A6B]">
                            {c.avatarUrl ? (
                              <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="36px" />
                            ) : (
                              (c.name[0] || "?").toUpperCase()
                            )}
                          </span>
                          <div>
                            <p className="font-medium text-neutral-900">{c.name}</p>
                            <p className="text-xs text-neutral-500">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-neutral-600">{formatDate(c.registeredAt)}</td>
                      <td className="px-3 py-3 text-neutral-600">{c.phone || "-"}</td>
                      <td className="px-3 py-3 text-neutral-600">{c.orders}</td>
                      <td className="px-3 py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="relative px-3 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-neutral-50"
                          onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                        >
                          ?
                        </button>
                        {menuFor === c.id && (
                          <div className="absolute right-3 z-10 mt-1 w-44 rounded-xl border border-neutral-200 bg-white py-2 text-left shadow-lg">
                            <Link
                              href={`/users/customers/${c.id}`}
                              className="block px-4 py-2 hover:bg-neutral-50"
                              onClick={() => setMenuFor(null)}
                            >
                              View profile
                            </Link>
                            <button
                              type="button"
                              className="block w-full px-4 py-2 text-left text-red-600 hover:bg-neutral-50"
                              onClick={() => {
                                setSuspendTarget(c);
                                setMenuFor(null);
                              }}
                            >
                              {c.status === "Active" ? "Suspend customer" : "Reactivate customer"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminMain>
      <Modal
        open={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        title={suspendTarget?.status === "Active" ? "Suspend customer" : "Reactivate customer"}
      >
        <p className="text-sm text-neutral-600">
          {suspendTarget?.status === "Active"
            ? "User will no longer have access to their account. Are you sure?"
            : "This user will be able to sign in again."}
        </p>
        {suspendTarget && (
          <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm">
            <p>
              <span className="text-neutral-500">Name:</span> {suspendTarget.name}
            </p>
            <p className="mt-1">
              <span className="text-neutral-500">Email:</span> {suspendTarget.email}
            </p>
            <p className="mt-1">
              <span className="text-neutral-500">Reg. date:</span>{" "}
              {formatDate(suspendTarget.registeredAt)}
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setSuspendTarget(null)}
            className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmSuspend()}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving..." : suspendTarget?.status === "Active" ? "Suspend" : "Reactivate"}
          </button>
        </div>
      </Modal>
    </>
  );
}
