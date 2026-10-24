"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const { login, isStaff, hydrated, homePath } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && isStaff) router.replace(homePath);
  }, [hydrated, isStaff, homePath, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const next = await login(email.trim(), password);
      router.push(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(
        /failed to fetch|networkerror|load failed/i.test(msg)
          ? "Cannot reach API. Make sure the backend is running on port 4000."
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px]">
      <div className="rounded-2xl bg-white px-7 py-9 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Enter your login details below
          </p>
        </div>

        <form onSubmit={onSubmit} className="mx-auto mt-8 w-full max-w-[320px] space-y-5">
          <label className="block text-sm font-medium text-neutral-800">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-[#4B0A6B]"
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="admin-password" className="text-sm font-medium text-neutral-800">
                Password
              </label>
              <button
                type="button"
                className="text-xs text-neutral-500 hover:text-neutral-700"
                onClick={() =>
                  setError("Password reset is not available yet. Use the seeded admin password.")
                }
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-3 pr-11 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-[#4B0A6B]"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 0 0 3.5 3.5M9.4 5.5A9.8 9.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.3 2.6-2.8 4M6.2 6.6C4.4 8 3.3 10 2.5 12c1 2.5 4.5 7 9.5 7 1.4 0 2.7-.3 3.9-.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M2.5 12C3.5 9.5 7 5 12 5s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#4B0A6B] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3d0858] disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}