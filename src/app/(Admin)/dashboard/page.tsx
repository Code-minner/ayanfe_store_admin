"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import RequirePermission from "@/components/admin/RequirePermission";
import { useAuth } from "@/context/AuthContext";
import { apiGetStats, type AdminStats } from "@/lib/api";
import { formatMomChange, formatNaira } from "@/lib/format";

function StatCard({
  label,
  value,
  hint,
  up,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  up?: boolean | null;
  href?: string;
}) {
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
        <p
          className={`mt-2 text-xs font-medium ${
            up === true ? "text-emerald-600" : up === false ? "text-red-500" : "text-neutral-500"
          }`}
        >
          {hint}
        </p>
      </div>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F3E6F6] text-[#4B0A6B]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M4 19V5m0 14h16M7 15l3-4 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#4B0A6B]/40"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">{body}</div>
  );
}

function share(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function conic(parts: { color: string; pct: number }[]) {
  let cursor = 0;
  const stops: string[] = [];
  for (const p of parts) {
    const next = cursor + p.pct;
    stops.push(`${p.color} ${cursor}% ${next}%`);
    cursor = next;
  }
  if (cursor < 100) stops.push(`#F3F4F6 ${cursor}% 100%`);
  return `conic-gradient(${stops.join(", ")})`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const { user, token } = useAuth();
  const name = user?.firstName || user?.name?.split(" ")[0] || "Admin";
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    void apiGetStats(token, { year: chartYear })
      .then((d) => {
        if (!cancelled) {
          setStats(d.stats);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load dashboard");
          setStats(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, chartYear]);

  const chart = stats?.customersChart ?? Array.from({ length: 12 }, () => 0);
  const max = Math.max(0, ...chart);
  const yearCustomers = useMemo(() => chart.reduce((s, n) => s + n, 0), [chart]);
  const customersMom = formatMomChange(stats?.customersChangePct);
  const ordersMom = formatMomChange(stats?.ordersChangePct);
  const revenueMom = formatMomChange(stats?.revenueConfirmedChangePct);
  const yearOptions = stats?.chartYears?.length
    ? stats.chartYears
    : [chartYear];

  const orderTotal = stats?.ordersTotal ?? 0;
  const pendingPct = share(stats?.ordersPending ?? 0, orderTotal);
  const completedPct = share(stats?.ordersCompleted ?? 0, orderTotal);
  const canceledPct = share(stats?.ordersCanceled ?? 0, orderTotal);

  const paidCount = stats?.paidCount ?? 0;
  const pendingPayCount = stats?.pendingPayCount ?? 0;
  const payDenom = Math.max(1, paidCount + pendingPayCount);
  const paidPayPct = share(paidCount, payDenom);
  const pendingPayPct = share(pendingPayCount, payDenom);

  return (
    <RequirePermission permission="dashboard">
      <TopBar />
      <AdminMain className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Hello {name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Live overview of how Attog Store is doing
          </p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {loading && !stats ? (
          <p className="text-sm text-neutral-500">Loading dashboard…</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total customers"
            value={String(stats?.customers ?? 0)}
            hint={customersMom.text}
            up={customersMom.up}
            href="/users/customers"
          />
          <StatCard
            label="Staff accounts"
            value={String(stats?.staff ?? 0)}
            hint="Admins & customer care"
            up={null}
            href="/users/admins"
          />
          <StatCard
            label="Active products"
            value={String(stats?.activeProducts ?? 0)}
            hint={
              stats
                ? `${stats.totalProducts} in catalog · ${stats.inactiveProducts} inactive`
                : "See all →"
            }
            up={null}
            href="/products"
          />
          <StatCard
            label="Confirmed revenue"
            value={formatNaira(stats?.revenueConfirmed ?? 0)}
            hint={revenueMom.text}
            up={revenueMom.up}
            href="/payments"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Orders</p>
            <p className="mt-2 text-2xl font-semibold">
              {(stats?.ordersTotal ?? 0).toLocaleString()}
            </p>
            <p
              className={`mt-1 text-xs font-medium ${
                ordersMom.up === true
                  ? "text-emerald-600"
                  : ordersMom.up === false
                    ? "text-red-500"
                    : "text-neutral-500"
              }`}
            >
              {ordersMom.text}
            </p>
            <div className="mt-6 flex items-center gap-6">
              <div
                className="relative grid h-36 w-36 place-items-center rounded-full"
                style={{
                  background: conic([
                    { color: "#4B0A6B", pct: pendingPct },
                    { color: "#9B4DCA", pct: completedPct },
                    { color: "#E9D5F5", pct: canceledPct },
                  ]),
                }}
              >
                <div className="h-20 w-20 rounded-full bg-white" />
              </div>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#4B0A6B]" />
                  Pending {stats?.ordersPending ?? 0} ({pendingPct}%)
                </li>
                <li>
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#9B4DCA]" />
                  Completed {stats?.ordersCompleted ?? 0} ({completedPct}%)
                </li>
                <li>
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#E9D5F5]" />
                  Failed / cancelled {stats?.ordersCanceled ?? 0} ({canceledPct}%)
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Payments</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatNaira(stats?.revenueInflow ?? 0)}
            </p>
            <p className="mt-1 text-xs font-medium text-neutral-500">
              All order value · confirmed {formatNaira(stats?.revenueConfirmed ?? 0)}
            </p>
            <div className="mt-6 flex items-center gap-6">
              <div
                className="relative grid h-36 w-36 place-items-center rounded-full"
                style={{
                  background: conic([
                    { color: "#4B0A6B", pct: pendingPayPct },
                    { color: "#9B4DCA", pct: paidPayPct },
                  ]),
                }}
              >
                <div className="h-20 w-20 rounded-full bg-white" />
              </div>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#4B0A6B]" />
                  Awaiting pay {pendingPayCount} ({pendingPayPct}%)
                </li>
                <li>
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#9B4DCA]" />
                  Confirmed {paidCount} ({paidPayPct}%)
                </li>
                <li className="text-xs text-neutral-500">
                  Paystack {stats?.byMethod?.paystack?.count ?? 0} · Bank{" "}
                  {stats?.byMethod?.bank_transfer?.count ?? 0}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">New customers</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {yearCustomers.toLocaleString()} signup{yearCustomers === 1 ? "" : "s"} in{" "}
                {chartYear}
                {stats?.customers != null
                  ? ` · ${stats.customers.toLocaleString()} total customers`
                  : ""}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              Year
              <select
                value={chartYear}
                onChange={(e) => setChartYear(Number(e.target.value))}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-[#4B0A6B]"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {yearCustomers === 0 ? (
            <p className="mt-10 text-center text-sm text-neutral-500">
              No customer signups recorded for {chartYear}.
            </p>
          ) : (
            <div className="mt-8">
              <div className="flex h-48 items-end gap-1.5 sm:gap-2">
                {chart.map((n, i) => {
                  const pct = max > 0 ? (n / max) * 100 : 0;
                  return (
                    <div
                      key={MONTHS[i]}
                      className="relative flex h-full min-w-0 flex-1 items-end justify-center"
                      title={`${MONTHS[i]} ${chartYear}: ${n} signup${n === 1 ? "" : "s"}`}
                    >
                      {n > 0 ? (
                        <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-[10px] font-semibold text-neutral-700">
                          {n}
                        </span>
                      ) : null}
                      <div
                        className={`w-full max-w-10 rounded-t-md ${
                          n > 0
                            ? "bg-gradient-to-t from-[#4B0A6B] to-[#C084FC]"
                            : "bg-neutral-100"
                        }`}
                        style={{ height: n > 0 ? `${Math.max(pct, 6)}%` : "2px" }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-1.5 sm:gap-2">
                {MONTHS.map((m) => (
                  <span
                    key={m}
                    className="min-w-0 flex-1 text-center text-[10px] text-neutral-400"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </AdminMain>
    </RequirePermission>
  );
}
