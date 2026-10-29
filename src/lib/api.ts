const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type AdminUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string | null;
};

async function parseJson(res: Response) {
  return res.json().catch(() => ({}));
}

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Invalid email or password");
  return data as { user: AdminUser; token: string };
}

export async function apiMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Session expired");
  return data as { user: AdminUser };
}

export async function apiUpdateProfile(
  token: string,
  body: { firstName?: string; lastName?: string; email?: string; phone?: string }
) {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not update profile");
  return data as { user: AdminUser };
}

export async function apiUploadAvatar(token: string, file: File) {
  const form = new FormData();
  form.append("avatar", file);
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/auth/me/avatar`, {
    method: "POST",
    headers,
    body: form,
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not upload avatar");
  return data as { user: AdminUser };
}

export async function apiGetOrders(token: string, status?: string) {
  const q = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${API_URL}/orders${q}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not load orders");
  return data as { orders: AdminOrder[] };
}

export async function apiGetOrder(token: string, id: string) {
  const res = await fetch(`${API_URL}/orders/${id}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Order not found");
  return data as { order: AdminOrder };
}

export async function apiUpdateOrderStatus(token: string, id: string, status: string) {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not update order");
  return data as { order: AdminOrder };
}

export async function apiGetProducts(
  token?: string | null,
  opts?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: "all" | "active" | "inactive";
    stock?: "all" | "in" | "out";
  }
) {
  const qs = new URLSearchParams({
    admin: "true",
    lean: "true",
    page: String(opts?.page ?? 1),
    limit: String(opts?.limit ?? 20),
  });
  if (opts?.q?.trim()) qs.set("q", opts.q.trim());
  if (opts?.status && opts.status !== "all") qs.set("status", opts.status);
  if (opts?.stock && opts.stock !== "all") qs.set("stock", opts.stock);

  const res = await fetch(`${API_URL}/products?${qs}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not load products");
  return data as {
    products: AdminProduct[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function apiGetProduct(idOrSlug: string) {
  const res = await fetch(
    `${API_URL}/products/${encodeURIComponent(idOrSlug)}?admin=true`,
    { cache: "no-store" }
  );
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Product not found");
  return data as { product: AdminProduct };
}

export async function apiGetCategories() {
  const res = await fetch(`${API_URL}/categories`, { cache: "no-store" });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not load categories");
  return data as {
    categories: { id: string; slug: string; name: string }[];
  };
}

export async function apiCreateProduct(
  token: string,
  body: {
    name: string;
    slug: string;
    description?: string;
    image: string;
    images?: string[];
    price: number;
    categorySlug: string;
    category?: string;
    brand?: string;
    stock?: number;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    active?: boolean;
    colors?: string[];
    variants?: AdminProductVariant[];
    subtitle?: string;
    /** Buy N of this product to unlock bonusPercent off. */
    bonusQty?: number | null;
    bonusPercent?: number | null;
  }
) {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not create product");
  return data as { product: AdminProduct };
}

export async function apiUploadProductImage(token: string, file: File) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_URL}/products/upload-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not upload image");
  return data as { url: string; publicId: string };
}

export type ProductWriteBody = {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  images?: string[];
  price?: number;
  categorySlug?: string;
  category?: string;
  brand?: string | null;
  stock?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  active?: boolean;
  colors?: string[];
  variants?: AdminProductVariant[];
  subtitle?: string | null;
  badge?: string | null;
  bonusQty?: number | null;
  bonusPercent?: number | null;
};

export async function apiUpdateProduct(token: string, id: string, body: ProductWriteBody) {
  const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not update product");
  return data as { product: AdminProduct };
}

export async function apiDeleteProduct(token: string, id: string) {
  const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not delete product");
  return data as { ok: boolean; id: string };
}

export async function apiGetSettings(token: string) {
  const res = await fetch(`${API_URL}/settings`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not load settings");
  return data as { settings: AdminSettings };
}

export async function apiUpdateSettings(
  token: string,
  body: Partial<AdminSettings> & {
    payments?: { paystack?: boolean; bankTransfer?: boolean };
  }
) {
  const res = await fetch(`${API_URL}/settings`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not save settings");
  return data as { settings: AdminSettings };
}

export type AdminOrder = {
  id: string;
  email: string;
  items: {
    name: string;
    image: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
    brand?: string;
  }[];
  subtotal: number;
  fee: number;
  total: number;
  paymentMethod: string;
  status: string;
  receiptUrl?: string | null;
  customerNote?: string | null;
  shipping?: {
    method?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    shippingFee?: number;
  } | null;
  invoiceNumber?: string | null;
  waybillNumber?: string | null;
  createdAt: string;
};

export async function apiFetchPrintOrders(
  token: string,
  opts: {
    type: "invoice" | "waybill";
    ids?: string[];
    from?: string;
    to?: string;
    method?: "local_pickup" | "waybill" | "stockpile" | "lagos_delivery" | "all";
  }
) {
  const qs = new URLSearchParams();
  qs.set("type", opts.type);
  if (opts.ids?.length) qs.set("ids", opts.ids.join(","));
  if (opts.from) qs.set("from", opts.from);
  if (opts.to) qs.set("to", opts.to);
  if (opts.method && opts.method !== "all") qs.set("method", opts.method);
  const res = await fetch(`${API_URL}/orders/print?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const html = await res.text();
  if (!res.ok) {
    let message = "Could not open print view";
    try {
      message = (JSON.parse(html) as { message?: string }).message || message;
    } catch {
      /* html error page */
    }
    throw new Error(message);
  }
  return html;
}

/** @deprecated Prefer apiFetchPrintOrders + in-app preview. Still opens a tab if needed. */
export async function apiPrintOrders(
  token: string,
  opts: {
    type: "invoice" | "waybill";
    ids?: string[];
    from?: string;
    to?: string;
    method?: "local_pickup" | "waybill" | "stockpile" | "lagos_delivery" | "all";
  }
) {
  const html = await apiFetchPrintOrders(token, opts);
  const win = window.open("", "_blank");
  if (!win) throw new Error("Pop-up blocked. Allow pop-ups to print.");
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export type AdminProductVariant = {
  id: string;
  label: string;
  price: number;
  stock: number;
  maxPerOrder?: number;
  /** Colors available for this size/option. */
  colors?: string[];
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  images?: string[];
  price: number;
  description?: string;
  category?: string | null;
  categorySlug: string;
  brand?: string | null;
  stock?: number;
  active?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  subtitle?: string | null;
  badge?: string | null;
  /** Min qty of this product to unlock the % bonus. */
  bonusQty?: number | null;
  bonusPercent?: number | null;
  colors?: string[];
  variants?: AdminProductVariant[] | null;
  createdAt?: string;
};

export type AdminSettings = {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  adminNotifyEmail?: string;
  payments: { paystack: boolean; bankTransfer: boolean };
};

export type AdminCustomer = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  registeredAt: string;
  orders: number;
  status: "Active" | "Suspended";
  active: boolean;
};

export type AdminStaff = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleKey?: string;
  dateAdded: string;
  lastActive: string;
  status: "Active" | "Inactive";
  active: boolean;
};

export type InviteStaffRole = "support" | "admin" | "super_admin";

export async function apiGetCustomers(
  token: string,
  opts?: { q?: string; status?: "all" | "active" | "inactive" }
) {
  const qs = new URLSearchParams();
  if (opts?.q?.trim()) qs.set("q", opts.q.trim());
  if (opts?.status && opts.status !== "all") qs.set("status", opts.status);
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await fetch(`${API_URL}/admin/customers${suffix}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not load customers");
  return data as { customers: AdminCustomer[] };
}

export async function apiGetCustomer(token: string, id: string) {
  const res = await fetch(`${API_URL}/admin/customers/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Customer not found");
  return data as { customer: AdminCustomer; orders: AdminOrder[] };
}

export async function apiSetCustomerStatus(token: string, id: string, active: boolean) {
  const res = await fetch(`${API_URL}/admin/customers/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ active }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not update customer");
  return data as { customer: AdminCustomer };
}

export type AdminStats = {
  customers: number;
  customersChangePct: number | null;
  staff: number;
  activeProducts: number;
  totalProducts: number;
  inactiveProducts: number;
  ordersTotal: number;
  ordersChangePct: number | null;
  ordersPending: number;
  ordersCompleted: number;
  ordersCanceled: number;
  revenueConfirmed: number;
  revenueConfirmedChangePct: number | null;
  revenueInflow: number;
  revenueInflowChangePct: number | null;
  revenuePending: number;
  revenuePendingChangePct: number | null;
  paidCount: number;
  pendingPayCount: number;
  byStatus: Record<string, { count: number; total: number }>;
  byMethod: Record<string, { count: number; total: number }>;
  customersChart: number[];
  chartYear: number;
  chartYears?: number[];
  customersInChartYear?: number;
};

export async function apiGetStats(token: string, opts?: { year?: number }) {
  const qs = opts?.year ? `?year=${encodeURIComponent(String(opts.year))}` : "";
  const res = await fetch(`${API_URL}/admin/stats${qs}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not load stats");
  return data as { stats: AdminStats };
}

export async function apiGetAdmins(token: string) {
  const res = await fetch(`${API_URL}/admin/admins`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not load admins");
  return data as { admins: AdminStaff[] };
}

export async function apiInviteAdmin(
  token: string,
  body: { name: string; email: string; role?: InviteStaffRole }
) {
  const res = await fetch(`${API_URL}/admin/admins/invite`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not invite staff");
  return data as { admin: AdminStaff; message: string };
}

export async function apiSetStaffRole(
  token: string,
  id: string,
  role: InviteStaffRole
) {
  const res = await fetch(`${API_URL}/admin/admins/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not update role");
  return data as { admin: AdminStaff };
}

export async function apiSetStaffStatus(token: string, id: string, active: boolean) {
  const res = await fetch(`${API_URL}/admin/admins/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ active }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not update staff status");
  return data as { admin: AdminStaff };
}

export async function apiDeleteStaff(token: string, id: string) {
  const res = await fetch(`${API_URL}/admin/admins/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || "Could not delete staff");
  return data as { ok: boolean; id: string };
}
