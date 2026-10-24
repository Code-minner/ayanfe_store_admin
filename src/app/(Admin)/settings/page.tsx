"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import RequirePermission from "@/components/admin/RequirePermission";
import { useAuth } from "@/context/AuthContext";
import { apiGetSettings, apiUpdateSettings } from "@/lib/api";

type Tab = "profile" | "payment";

function splitName(name?: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || "",
    last: parts.slice(1).join(" ") || "",
  };
}

function localPhone(value?: string) {
  const raw = (value || "").replace(/\s+/g, "");
  if (raw.startsWith("+234")) return raw.slice(4).replace(/^0+/, "") || raw.slice(4);
  if (raw.startsWith("234")) return raw.slice(3).replace(/^0+/, "") || raw.slice(3);
  return raw;
}

export default function SettingsPage() {
  const { token, user, updateProfile, uploadAvatar, can } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const canPaymentSettings = can("payment_settings");

  const [tab, setTab] = useState<Tab>("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paystack, setPaystack] = useState(false);
  const [bankTransfer, setBankTransfer] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || splitName(user.name).first);
    setLastName(user.lastName || splitName(user.name).last);
    setEmail(user.email || "");
    setPhone(localPhone(user.phone));
  }, [user]);

  useEffect(() => {
    if (!token || !canPaymentSettings) return;
    void apiGetSettings(token)
      .then(({ settings }) => {
        setPaystack(Boolean(settings.payments?.paystack));
        setBankTransfer(Boolean(settings.payments?.bankTransfer));
      })
      .catch(() => {
        /* keep defaults if settings fail */
      });
  }, [token, canPaymentSettings]);

  useEffect(() => {
    if (!canPaymentSettings && tab === "payment") setTab("profile");
  }, [canPaymentSettings, tab]);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() ? `+234${localPhone(phone)}` : "",
      });
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const onSavePayments = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !canPaymentSettings) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await apiUpdateSettings(token, {
        payments: { paystack, bankTransfer },
      });
      setMessage("Payment options saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save payment options");
    } finally {
      setSaving(false);
    }
  };

  const onAvatar = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      await uploadAvatar(file);
      setMessage("Photo updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile" },
    ...(canPaymentSettings
      ? [{ id: "payment" as const, label: "Payment option" }]
      : []),
  ];

  return (
    <RequirePermission permission="settings">
      <TopBar />
      <AdminMain>
        <h1 className="text-3xl font-bold tracking-wide text-neutral-900 sm:text-4xl">
          Settings
        </h1>

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row">
            <aside className="shrink-0 border-b border-neutral-200 sm:w-44 sm:border-b-0 sm:border-r">
              <nav
                className="flex gap-6 px-5 pt-5 sm:flex-col sm:gap-4 sm:px-5 sm:py-7"
                aria-label="Settings sections"
              >
                {tabs.map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTab(item.id);
                        setMessage("");
                        setError("");
                      }}
                      className={`relative pb-2 text-left text-sm transition sm:pb-1 ${
                        active
                          ? "font-semibold text-[#4B0A6B]"
                          : "font-medium text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      {item.label}
                      {active ? (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#4B0A6B]" />
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="min-w-0 flex-1 p-5 sm:p-7">
              {tab === "profile" ? (
                <form onSubmit={onSaveProfile} className="mx-auto w-full max-w-xl space-y-5">
                  <h2 className="text-2xl font-bold tracking-wide text-neutral-900">Profile</h2>

                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-[#F3E6F6] text-[#4B0A6B] ring-4 ring-white"
                      aria-label="Change profile photo"
                    >
                      {user?.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <span className="text-3xl font-semibold">
                          {(firstName[0] || user?.name?.[0] || "A").toUpperCase()}
                        </span>
                      )}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => void onAvatar(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <p className="text-center text-xs text-neutral-500">
                    {uploading ? "Uploading photo…" : "Tap the photo to change it"}
                  </p>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-neutral-800">
                      First name
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        required
                        className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-[#4B0A6B]"
                      />
                    </label>
                    <label className="block text-sm font-medium text-neutral-800">
                      Last name
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required
                        className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-[#4B0A6B]"
                      />
                    </label>
                  </div>

                  <label className="block text-sm font-medium text-neutral-800">
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Example@gmail.com"
                      required
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-[#4B0A6B]"
                    />
                  </label>

                  <label className="block text-sm font-medium text-neutral-800">
                    Phone Number
                    <div className="mt-2 flex overflow-hidden rounded-xl border border-neutral-300 focus-within:border-[#4B0A6B]">
                      <span className="inline-flex items-center gap-1.5 border-r border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-700">
                        <svg viewBox="0 0 24 16" className="h-3.5 w-5 rounded-[2px]" aria-hidden>
                          <rect width="8" height="16" fill="#008751" />
                          <rect x="8" width="8" height="16" fill="#FFFFFF" />
                          <rect x="16" width="8" height="16" fill="#008751" />
                        </svg>
                        <span>+234</span>
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="08012345678"
                        inputMode="tel"
                        className="w-full px-3.5 py-3 text-sm outline-none placeholder:text-neutral-400"
                      />
                    </div>
                  </label>

                  {error ? <p className="text-xs text-red-600">{error}</p> : null}
                  {message ? <p className="text-xs text-emerald-700">{message}</p> : null}

                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="rounded-xl bg-[#4B0A6B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3a0854] disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </form>
              ) : (
                <form onSubmit={onSavePayments} className="mx-auto w-full max-w-xl space-y-5">
                  <h2 className="text-2xl font-bold tracking-wide text-neutral-900">
                    Payment option
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Choose which checkout methods shoppers can use on Attog Store.
                  </p>

                  <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input
                        type="checkbox"
                        checked={paystack}
                        onChange={(e) => setPaystack(e.target.checked)}
                        className="h-4 w-4 accent-[#4B0A6B]"
                      />
                      Enable Paystack
                    </label>
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input
                        type="checkbox"
                        checked={bankTransfer}
                        onChange={(e) => setBankTransfer(e.target.checked)}
                        className="h-4 w-4 accent-[#4B0A6B]"
                      />
                      Enable bank transfer
                    </label>
                  </div>

                  {error ? <p className="text-xs text-red-600">{error}</p> : null}
                  {message ? <p className="text-xs text-emerald-700">{message}</p> : null}

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#4B0A6B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3a0854] disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </AdminMain>
    </RequirePermission>
  );
}
