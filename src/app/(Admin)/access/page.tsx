"use client";

import Link from "next/link";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import { useAuth } from "@/context/AuthContext";
import {
  PERMISSION_META,
  STAFF_ROLES,
  permissionsFor,
  roleBlurb,
  roleLabel,
  type StaffPermission,
  type StaffRole,
} from "@/lib/roles";

function AccessCard({
  role,
  highlight,
}: {
  role: StaffRole;
  highlight?: boolean;
}) {
  const allowed = new Set(permissionsFor(role));
  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-[#4B0A6B] bg-[#F8F1FA]"
          : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{roleLabel(role)}</h2>
          <p className="mt-1 text-sm text-neutral-600">{roleBlurb(role)}</p>
        </div>
        {highlight ? (
          <span className="rounded-full bg-[#4B0A6B] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Your role
          </span>
        ) : null}
      </div>

      <ul className="mt-5 space-y-2.5">
        {PERMISSION_META.map((p) => {
          const yes = allowed.has(p.key);
          return (
            <li
              key={p.key}
              className={`flex gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                yes
                  ? "border-emerald-100 bg-emerald-50/60"
                  : "border-neutral-100 bg-neutral-50/80 opacity-70"
              }`}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  yes ? "bg-emerald-600 text-white" : "bg-neutral-300 text-neutral-700"
                }`}
                aria-hidden
              >
                {yes ? "✓" : "–"}
              </span>
              <span>
                <span className="font-medium text-neutral-900">{p.label}</span>
                <span className="mt-0.5 block text-xs text-neutral-600">{p.description}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export default function AccessPage() {
  const { role, can } = useAuth();
  const mine = permissionsFor(role);
  const mineSet = new Set<StaffPermission>(mine);

  return (
    <>
      <TopBar
        breadcrumb={<span className="font-semibold text-neutral-900">My access</span>}
      />
      <AdminMain>
        <div className="max-w-5xl">
          <h1 className="text-2xl font-semibold text-neutral-900">What you can do</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
            Your signed-in role is{" "}
            <strong className="text-neutral-900">{role ? roleLabel(role) : "Unknown"}</strong>.
            Use this page to see which areas of the admin app you can open. Customer Care and
            Admin accounts are limited on purpose; only Super Admin can suspend or delete staff.
          </p>

          {role ? (
            <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Your access now
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PERMISSION_META.filter((p) => mineSet.has(p.key)).map((p) => (
                  <li
                    key={p.key}
                    className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3.5 py-3 text-sm"
                  >
                    <p className="font-medium text-neutral-900">{p.label}</p>
                    <p className="mt-0.5 text-xs text-neutral-600">{p.description}</p>
                  </li>
                ))}
              </ul>
              {PERMISSION_META.some((p) => !mineSet.has(p.key)) ? (
                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Not available on your role
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {PERMISSION_META.filter((p) => !mineSet.has(p.key)).map((p) => (
                      <li
                        key={p.key}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600"
                      >
                        {p.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-neutral-900">All roles compared</h2>
            <p className="mt-1 text-sm text-neutral-600">
              So Customer Care and Admins can see the difference without guessing.
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              {STAFF_ROLES.map((r) => (
                <AccessCard key={r} role={r} highlight={r === role} />
              ))}
            </div>
          </section>

          {can("manage_staff") ? (
            <p className="mt-8 text-sm text-neutral-600">
              As Super Admin you can suspend or delete Admin / Customer Care from{" "}
              <Link href="/users/admins" className="font-semibold text-[#4B0A6B] hover:underline">
                User Management → Staff
              </Link>
              .
            </p>
          ) : null}
        </div>
      </AdminMain>
    </>
  );
}
