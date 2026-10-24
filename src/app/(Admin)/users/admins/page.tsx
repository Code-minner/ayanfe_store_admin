"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import RequirePermission from "@/components/admin/RequirePermission";
import SearchInput from "@/components/ui/SearchInput";
import StatusPill from "@/components/ui/StatusPill";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  apiGetAdmins,
  apiInviteAdmin,
  type AdminStaff,
  type InviteStaffRole,
} from "@/lib/api";
import { MOCK_ROLES, PERMISSIONS } from "@/lib/mock";
import { formatDate } from "@/lib/format";

export default function AdminsPage() {
  const { token, role, can } = useAuth();
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
  const [roleModal, setRoleModal] = useState<"add" | "edit" | null>(null);
  const [roleTitle, setRoleTitle] = useState("Admin");
  const [perms, setPerms] = useState<string[]>([
    "KYC Approval",
    "Edit User",
    "Read Products",
    "Delete Products",
    "Approve Products",
  ]);

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

  const togglePerm = (p: string) => {
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

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

  const inviteOptions: { value: InviteStaffRole; label: string }[] = [
    { value: "support", label: "Customer Care" },
    { value: "admin", label: "Admin" },
    ...(role === "super_admin"
      ? [{ value: "super_admin" as const, label: "Super Admin" }]
      : []),
  ];

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
                {t === "admins" ? "staff" : t}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <SearchInput value={q} onChange={setQ} />
            {can("invite_staff") ? (
              <button
                type="button"
                onClick={() => (tab === "admins" ? setAddOpen(true) : setRoleModal("add"))}
                className="rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white"
              >
                {tab === "admins" ? "+ Invite staff" : "+ Add role"}
              </button>
            ) : null}
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
                        Loading admins…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-neutral-500">
                        No admins yet. Invite one to get started.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr key={a.id} className="border-b border-neutral-100 last:border-0">
                        <td className="px-3 py-3 font-medium">{a.name}</td>
                        <td className="px-3 py-3 text-neutral-600">{a.email}</td>
                        <td className="px-3 py-3 text-neutral-600">{a.role}</td>
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
                            ⋮
                          </button>
                          {menuFor === a.id && (
                            <div className="absolute right-3 z-10 mt-1 w-44 rounded-xl border border-neutral-200 bg-white py-2 text-left shadow-lg">
                              <button
                                type="button"
                                className="block w-full px-4 py-2 text-left hover:bg-neutral-50"
                                onClick={() => {
                                  setViewAdmin(a);
                                  setMenuFor(null);
                                }}
                              >
                                View admin
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
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-neutral-500">
                  <tr className="border-b border-neutral-100">
                    <th className="px-3 py-3 font-medium">Title</th>
                    <th className="px-3 py-3 font-medium">Permissions</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ROLES.map((r) => (
                    <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-3 py-4 align-top font-medium">{r.title}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          {r.permissions.map((p) => (
                            <span
                              key={p}
                              className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          className="mr-2 text-neutral-500 hover:text-[#4B0A6B]"
                          onClick={() => {
                            setRoleTitle(r.title);
                            setRoleModal("edit");
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              {inviting ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(viewAdmin)} onClose={() => setViewAdmin(null)} title="Admin details">
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
              <dd className="font-medium">{viewAdmin.role}</dd>
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
        open={Boolean(roleModal)}
        onClose={() => setRoleModal(null)}
        title={roleModal === "edit" ? "Edit role" : "Add new role"}
        wide
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setRoleModal(null);
          }}
        >
          <label className="block text-sm font-medium">
            Title
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Enter title"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]"
            />
          </label>
          <div>
            <p className="text-sm font-medium">Permissions</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={perms.includes(p)}
                    onChange={() => togglePerm(p)}
                    className="h-4 w-4 accent-[#4B0A6B]"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRoleModal(null)}
              className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {roleModal === "edit" ? "Save changes" : "Add Role"}
            </button>
          </div>
        </form>
      </Modal>
    </RequirePermission>
  );
}
