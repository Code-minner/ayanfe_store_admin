"use client";

import { FormEvent, useEffect, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import RequirePermission from "@/components/admin/RequirePermission";
import { useAuth } from "@/context/AuthContext";
import { apiGetSettings, apiUpdateSettings } from "@/lib/api";

export default function SettingsPage() {
  const { token } = useAuth();
  const [storeName, setStoreName] = useState("Ayanfe Store");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [adminNotifyEmail, setAdminNotifyEmail] = useState("");
  const [paystack, setPaystack] = useState(false);
  const [bankTransfer, setBankTransfer] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    void apiGetSettings(token)
      .then(({ settings }) => {
        setStoreName(settings.storeName || "Ayanfe Store");
        setStoreAddress(settings.storeAddress || "");
        setStorePhone(settings.storePhone || "");
        setAdminNotifyEmail(settings.adminNotifyEmail || "");
        setPaystack(Boolean(settings.payments?.paystack));
        setBankTransfer(Boolean(settings.payments?.bankTransfer));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load settings"));
  }, [token]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await apiUpdateSettings(token, {
        storeName,
        storeAddress,
        storePhone,
        adminNotifyEmail,
        payments: { paystack, bankTransfer },
      });
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequirePermission permission="settings">
      <TopBar breadcrumb={<span className="font-semibold text-neutral-900">Settings</span>} />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <form onSubmit={onSave} className="mt-5 max-w-2xl space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium">Store name
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]" />
          </label>
          <label className="block text-sm font-medium">Store address
            <input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]" />
          </label>
          <label className="block text-sm font-medium">Store phone
            <input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]" />
          </label>
          <label className="block text-sm font-medium">Admin notify email
            <input type="email" value={adminNotifyEmail} onChange={(e) => setAdminNotifyEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none focus:border-[#4B0A6B]" />
          </label>
          <div className="space-y-3 rounded-xl bg-neutral-50 p-4">
            <p className="text-sm font-medium">Payments</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={paystack} onChange={(e) => setPaystack(e.target.checked)} className="accent-[#4B0A6B]" /> Enable Paystack</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bankTransfer} onChange={(e) => setBankTransfer(e.target.checked)} className="accent-[#4B0A6B]" /> Enable bank transfer</label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {message && <p className="text-xs text-emerald-700">{message}</p>}
          <button type="submit" disabled={saving} className="rounded-xl bg-[#4B0A6B] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </main>
    </RequirePermission>
  );
}