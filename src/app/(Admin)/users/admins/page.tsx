"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import RequirePermission from "@/components/admin/RequirePermission";
import SearchInput from "@/components/ui/SearchInput";
import StatusPill from "@/components/ui/StatusPill";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  apiDeleteStaff,
  apiGetAdmins,
  apiInviteAdmin,
  apiSetStaffRole,
  apiSetStaffStatus,
  type AdminStaff,
  type InviteStaffRole,
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  PERMISSION_META,
  STAFF_ROLES,
  permissionsFor,
  roleBlurb,
  roleLabel,
  type StaffRole,
} from "@/lib/roles";

function staffRoleKey(a: AdminStaff): StaffRole | null {
  if (a.roleKey && STAFF_ROLES.includes(a.roleKey as StaffRole)) {
    return a.roleKey as StaffRole;
  }
  const lower = a.role.toLowerCase().replace(/\s+/g, "_");
  if (STAFF_ROLES.includes(lower as StaffRole)) return lower as StaffRole;
  if (a.role === "Customer Care") return "support";
  if (a.role === "Admin") return "admin";
  if (a.role === "Super Admin") return "super_admin";
  return null;
}

export default function AdminsPage() {
  const { token, role, can, user } = useAuth();
  const manage = can("manage_staff");
  const [tab, setTab] = useState<"admins" | "roles">("admins");
  const [q, setQ] = useState("");
  const [admins, setAdmins] = useState<AdminStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteStaffRole>("support");
  const [inviting, setInviting] = useState(false);
  const [viewAdmin, setViewAdmin] = useState<AdminStaff | null>(null);
  const [statusTarget, setStatusTarget] = useState<AdminStaff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStaff | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminStaff | null>(null);
  const [nextRole, setNextRole] = useState<InviteStaffRole>("support");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiGetAdmins(token);
      setAdmins(data.admins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admins");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(
    () =>
      admins.filter(
        (a) =>
          a.name.toLowerCase().includes(q.toLowerCase()) ||
          a.email.toLowerCase().includes(q.toLowerCase())
      ),
    [admins, q]
  );

  const onInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setInviting(true);
    setError("");
    setMessage("");
    try {
      const data = await apiInviteAdmin(token, {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setAdmins((prev) => [data.admin, ...prev]);
      setMessage(data.message || "Invite sent.");
      setInviteName("");
      setInviteEmail("");
      setInviteRole("support");
      setAddOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not invite admin");
    } finally {
      setInviting(false);
    }
  };

  const confirmStatus = async () => {
    if (!token || !statusTarget) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiSetStaffStatus(token, statusTarget.id, !statusTarget.active);
      setAdmins((prev) => prev.map((a) => (a.id === data.admin.id ? data.admin : a)));
      setMessage(
        data.admin.active
          ? `${data.admin.name} reactivated.`
          : `${data.admin.name} suspended. They cannot sign in.`
      );
      setStatusTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update staff status");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;
    setBusy(true);
    setError("");
    try {
      await apiDeleteStaff(token, deleteTarget.id);
      setAdmins((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setMessage(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete staff");
    } finally {
      setBusy(false);
    }
  };

  const confirmRole = async () => {
    if (!token || !roleTarget) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiSetStaffRole(token, roleTarget.id, nextRole);
      setAdmins((prev) => prev.map((a) => (a.id === data.admin.id ? data.admin : a)));
      setMessage(`${data.admin.name} is now ${data.admin.role}.`);
      setRoleTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role");
    } finally {
      setBusy(false);
    }
  };

  const inviteOptions: { value: InviteStaffRole; label: string }[] = [
    { value: "support", label: "Customer Care" },
    { value: "admin", label: "Admin" },
    ...(role === "super_admin"
      ? [{ value: "super_admin" as const, label: "Super Admin" }]
      : []),
  ];

  const canActOn = (a: AdminStaff) => {
    if (!manage) return false;
    if (user?.id && a.id === user.id) return false;
    return true;
  };

  const canDelete = (a: AdminStaff) => {
    if (!canActOn(a)) return false;
    const key = staffRoleKey(a);
    return key === "support" || key === "admin";
  };

  return (
    <RequirePermission permission="admins">
      <TopBar
        breadcrumb={
          <>
            User Management &gt; <span className="font-semibold text-neutral-900">Staff</span>
          </>
        }
      />
      <AdminMain>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex gap-6 border-b border-neutral-100">
            {(["admins", "roles"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-medium capitalize ${
                  tab === t ? "border-b-2 border-[#4B0A6B] text-neutral-900" : "text-neutral-500"
                }`}
              >
                {t === "admins" ? "staff" : "roles & access"}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            {tab === "admins" ? <SearchInput value={q} onChange={setQ} /> : <div />}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/access"
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                My access
              </Link>
              {can("invite_staff") && tab === "admins" ? (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  + Invite staff
                </button>
              ) : null}
            </div>
          </div>

          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          {tab === "admins" ? (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-neutral-500">
                  <tr className="border-b border-neutral-100">
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Email</th>
                    <th className="px-3 py-3 font-medium">Role</th>
                    <th className="px-3 py-3 font-medium">Date added</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-neutral-500">
                        Loading staff...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-neutral-500">
                        No staff yet. Invite someone to get started.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => {
                      const key = staffRoleKey(a);
                      const isSelf = Boolean(user?.id && a.id === user.id);
                      return (
                        <tr key={a.id} className="border-b border-neutral-100 last:border-0">
                          <td className="px-3 py-3 font-medium">
                            {a.name}
                            {isSelf ? (
                              <span className="ml-2 text-xs font-normal text-neutral-400">(you)</span>
                            ) : null}
                          </td>
                          <td className="px-3 py-3 text-neutral-600">{a.email}</td>
                          <td className="px-3 py-3 text-neutral-600">
                            {key ? roleLabel(key) : a.role}
                          </td>
                          <td className="px-3 py-3 text-neutral-600">{formatDate(a.dateAdded)}</td>
                          <td className="px-3 py-3">
                            <StatusPill status={a.status} />
                          </td>
                          <td className="relative px-3 py-3 text-right">
                            <button
                              type="button"
                              className="rounded-lg p-2 hover:bg-neutral-50"
                              onClick={() => setMenuFor(menuFor === a.id ? null : a.id)}
                            >
                              ...
                            </button>
                            {menuFor === a.id && (
                              <div className="absolute right-3 z-10 mt-1 w-48 rounded-xl border border-neutral-200 bg-white py-2 text-left shadow-lg">
                                <button
                                  type="button"
                                  className="block w-full px-4 py-2 text-left hover:bg-neutral-50"
                                  onClick={() => {
                                    setViewAdmin(a);
                                    setMenuFor(null);
                                  }}
                                >
                                  View details
                                </button>
                                {canActOn(a) ? (
                                  <>
                                    <button
                                      type="button"
                                      className="block w-full px-4 py-2 text-left hover:bg-neutral-50"
                                      onClick={() => {
                                        setNextRole((staffRoleKey(a) as InviteStaffRole) || "support");
                                        setRoleTarget(a);
                                        setMenuFor(null);
                                      }}
                                    >
                                      Change role
                                    </button>
                                    <button
                                      type="button"
                                      className="block w-full px-4 py-2 text-left hover:bg-neutral-50"
                                      onClick={() => {
                                        setStatusTarget(a);
                                        setMenuFor(null);
                                      }}
                                    >
                                      {a.active ? "Suspend access" : "Reactivate"}
                                    </button>
                                  </>
                                ) : null}
                                {canDelete(a) ? (
                                  <button
                                    type="button"
                                    className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      setDeleteTarget(a);
                                      setMenuFor(null);
                                    }}
                                  >
                                    Delete
                                  </button>
                                ) : null}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {manage ? (
                <p className="mt-4 text-xs text-neutral-500">
                  Suspend blocks sign-in. Delete removes Customer Care or Admin accounts. Super
                  Admins cannot be deleted here (change their role first).
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <p className="text-sm text-neutral-600">
                Fixed roles for this store. Staff can also open{" "}
                <Link href="/access" className="font-semibold text-[#4B0A6B] hover:underline">
                  My access
                </Link>{" "}
                to see what their own account can do.
              </p>
              <div className="grid gap-4 lg:grid-cols-3">
                {STAFF_ROLES.map((r) => {
                  const allowed = new Set(permissionsFor(r));
                  return (
                    <article
                      key={r}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4"
                    >
                      <h3 className="font-semibold text-neutral-900">{roleLabel(r)}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                        {roleBlurb(r)}
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {PERMISSION_META.map((p) => (
                          <li
                            key={p.key}
                            className={`text-xs ${
                              allowed.has(p.key) ? "text-emerald-800" : "text-neutral-400"
                            }`}
                          >
                            {allowed.has(p.key) ? "✓" : "–"} {p.label}
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </AdminMain>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Invite staff">
        <form className="space-y-4" onSubmit={(e) => void onInvite(e)}>
          <p className="text-sm text-neutral-600">
            We will email them a temporary password so they can sign in to the admin app.
          </p>
          <label className="block text-sm font-medium">
            Full name
            <input
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Enter full name"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              required
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="staff@example.com"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            />
          </label>
          <label className="block text-sm font-medium">
            Role
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as InviteStaffRole)}
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            >
              {inviteOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(viewAdmin)} onClose={() => setViewAdmin(null)} title="Staff details">
        {viewAdmin && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Name</dt>
              <dd className="font-medium">{viewAdmin.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Email</dt>
              <dd className="font-medium">{viewAdmin.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Role</dt>
              <dd className="font-medium">
                {staffRoleKey(viewAdmin)
                  ? roleLabel(staffRoleKey(viewAdmin)!)
                  : viewAdmin.role}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Date added</dt>
              <dd className="font-medium">{formatDate(viewAdmin.dateAdded)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Status</dt>
              <dd>
                <StatusPill status={viewAdmin.status} />
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.active ? "Suspend staff" : "Reactivate staff"}
      >
        {statusTarget ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              {statusTarget.active
                ? `Suspend ${statusTarget.name}? They will not be able to sign in until you reactivate them.`
                : `Reactivate ${statusTarget.name}? They will be able to sign in again.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmStatus()}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                  statusTarget.active ? "bg-amber-600" : "bg-[#4B0A6B]"
                }`}
              >
                {busy
                  ? "Saving..."
                  : statusTarget.active
                    ? "Suspend"
                    : "Reactivate"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete staff">
        {deleteTarget ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Permanently delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? This
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(roleTarget)} onClose={() => setRoleTarget(null)} title="Change role">
        {roleTarget ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Update role for <strong>{roleTarget.name}</strong>.
            </p>
            <label className="block text-sm font-medium">
              Role
              <select
                value={nextRole}
                onChange={(e) => setNextRole(e.target.value as InviteStaffRole)}
                className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
              >
                {inviteOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRoleTarget(null)}
                className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmRole()}
                className="rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save role"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </RequirePermission>
  );
}
