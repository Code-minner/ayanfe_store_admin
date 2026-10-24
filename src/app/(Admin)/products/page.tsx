"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import TopBar from "@/components/admin/TopBar";
import AdminMain from "@/components/admin/AdminMain";
import RequirePermission from "@/components/admin/RequirePermission";
import ProductThumb from "@/components/admin/ProductThumb";
import SearchInput from "@/components/ui/SearchInput";
import { useAuth } from "@/context/AuthContext";
import { apiDeleteProduct, apiGetProducts, type AdminProduct } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "all">("active");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGetProducts(token, {
          page,
          limit: PAGE_SIZE,
          q: debouncedQ || undefined,
          status,
        });
        if (cancelled) return;
        setProducts(data.products || []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, page, debouncedQ, status]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const goTo = (next: number) => {
    startTransition(() => setPage(Math.min(totalPages, Math.max(1, next))));
  };

  const onDelete = async (product: AdminProduct) => {
    if (!token) return;
    const ok = window.confirm(`Delete "${product.name}"? This cannot be undone.`);
    if (!ok) return;
    setDeletingId(product.id);
    setError("");
    try {
      await apiDeleteProduct(token, product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <RequirePermission permission="products">
      <TopBar breadcrumb={<span className="font-semibold text-neutral-900">Products</span>} />
      <AdminMain>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Products</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {loading
                ? "Loading…"
                : `${total} ${status === "all" ? "" : status + " "}product${total === 1 ? "" : "s"} · page ${page} of ${totalPages}`}
            </p>
          </div>
          <Link
            href="/products/new"
            className="inline-flex items-center rounded-xl bg-[#4B0A6B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3a0854]"
          >
            + Add product
          </Link>
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <SearchInput value={q} onChange={setQ} placeholder="Search name, slug, category…" />
            <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
              {(
                [
                  ["active", "Active"],
                  ["inactive", "Inactive"],
                  ["all", "All"],
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
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {loading && products.length === 0 ? (
            <p className="mt-8 text-sm text-neutral-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="mt-8 text-sm text-neutral-500">No products found.</p>
          ) : (
            <>
              <div
                className={`mt-5 overflow-x-auto transition-opacity ${
                  loading || pending ? "opacity-60" : "opacity-100"
                }`}
              >
                <table className="min-w-full text-left text-sm">
                  <thead className="text-neutral-500">
                    <tr className="border-b border-neutral-100">
                      <th className="px-3 py-3 font-medium">Product</th>
                      <th className="px-3 py-3 font-medium">Category</th>
                      <th className="px-3 py-3 font-medium">Price</th>
                      <th className="px-3 py-3 font-medium">Stock</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Date Added</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-neutral-100 last:border-0">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <ProductThumb src={p.image} alt={p.name} size={40} />
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-neutral-500">{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-neutral-600">{p.category || p.categorySlug}</td>
                        <td className="px-3 py-3 text-neutral-600">
                          {p.price > 0 ? formatNaira(p.price) : (
                            <span className="text-amber-700">No price</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-neutral-600">{p.stock ?? "—"}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              p.active === false
                                ? "bg-neutral-100 text-neutral-600"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {p.active === false ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-neutral-600">
                          {p.createdAt ? formatDate(p.createdAt) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/products/${p.id}`}
                              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#4B0A6B] hover:bg-[#F3E6F6]"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              disabled={deletingId === p.id}
                              onClick={() => void onDelete(p)}
                              aria-label={`Delete ${p.name}`}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                aria-hidden
                              >
                                <path
                                  d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              {deletingId === p.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav
                className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4"
                aria-label="Products pagination"
              >
                <p className="text-xs text-neutral-500">
                  Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => goTo(page - 1)}
                    disabled={page <= 1 || loading}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goTo(n)}
                      disabled={loading}
                      aria-current={n === page ? "page" : undefined}
                      className={`min-w-9 rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                        n === page
                          ? "bg-[#4B0A6B] text-white"
                          : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => goTo(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </nav>
            </>
          )}
        </div>
      </AdminMain>
    </RequirePermission>
  );
}
