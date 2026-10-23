"use client";

import TopBar from "@/components/admin/TopBar";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_STATS } from "@/lib/mock";
import { formatNaira } from "@/lib/format";

function StatCard({
  label,
  value,
  hint,
  up,
}: {
  label: string;
  value: string;
  hint: string;
  up?: boolean | null;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
          <p
            className={`mt-2 text-xs font-medium ${
              up === true ? "text-emerald-600" : up === false ? "text-red-500" : "text-[#4B0A6B]"
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
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const name = user?.firstName || user?.name?.split(" ")[0] || "Admin";
  const chart = DASHBOARD_STATS.customersChart;
  const max = Math.max(...chart);

  return (
    <>
      <TopBar />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Hello {name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Here&apos;s an overview of how Ayanfe store is doing
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total customers" value={String(DASHBOARD_STATS.customers)} hint="↓ 1% than last month" up={false} />
          <StatCard label="Total sellers" value={String(DASHBOARD_STATS.sellers)} hint="↑ 40% than last month" up />
          <StatCard label="Total admins" value={String(DASHBOARD_STATS.admins)} hint="↑ 40% than last month" up />
          <StatCard label="Active products" value={String(DASHBOARD_STATS.activeProducts)} hint="See all →" up={null} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Orders</p>
            <p className="mt-2 text-2xl font-semibold">{DASHBOARD_STATS.ordersTotal.toLocaleString()}</p>
            <p className="mt-1 text-xs font-medium text-emerald-600">↑ 0.2% than last month</p>
            <div className="mt-6 flex items-center gap-6">
              <div className="relative grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#4B0A6B_0_65%,#9B4DCA_65%_95%,#E9D5F5_95%_100%)]">
                <div className="h-20 w-20 rounded-full bg-white" />
              </div>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#4B0A6B]" />Pending 65%</li>
                <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#9B4DCA]" />Completed 30%</li>
                <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#E9D5F5]" />Refunded 15%</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Transactions</p>
            <p className="mt-2 text-2xl font-semibold">{formatNaira(DASHBOARD_STATS.transactionsTotal)}</p>
            <p className="mt-1 text-xs font-medium text-emerald-600">↑ 0.2% than last month</p>
            <div className="mt-6 flex items-center gap-6">
              <div className="relative grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#4B0A6B_0_75%,#E9D5F5_75%_100%)]">
                <div className="h-20 w-20 rounded-full bg-white" />
              </div>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#4B0A6B]" />Pending 75%</li>
                <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#E9D5F5]" />Completed 25%</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Customers</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Users 2,153{" "}
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  +4.37%
                </span>
              </p>
            </div>
            <select className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm">
              <option>2025</option>
            </select>
          </div>
          <div className="mt-8 flex h-56 items-end gap-2">
            {chart.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[#4B0A6B] to-[#C084FC]"
                  style={{ height: `${(n / max) * 100}%` }}
                  title={`${n.toLocaleString()} users`}
                />
                <span className="text-[10px] text-neutral-400">
                  {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
