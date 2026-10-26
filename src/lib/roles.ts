export type StaffRole = "support" | "admin" | "super_admin";

export const STAFF_ROLES: StaffRole[] = ["support", "admin", "super_admin"];

export function isStaffRole(role: string | undefined | null): role is StaffRole {
  return Boolean(role && STAFF_ROLES.includes(role as StaffRole));
}

export function roleLabel(role: string): string {
  switch (role) {
    case "support":
      return "Customer Care";
    case "admin":
      return "Admin";
    case "super_admin":
      return "Super Admin";
    default:
      return role;
  }
}

export function roleBlurb(role: string): string {
  switch (role) {
    case "support":
      return "Handles customers, orders, and payment follow-up. Cannot edit products, settings, or staff.";
    case "admin":
      return "Runs day-to-day store ops: products, orders, customers, payments, and invites staff (not Super Admin).";
    case "super_admin":
      return "Full access. Can manage payment switches, invite any role, and suspend or delete Admin / Customer Care.";
    default:
      return "";
  }
}

/** Pages / nav sections gated by role. */
export type StaffPermission =
  | "dashboard"
  | "customers"
  | "admins"
  | "products"
  | "orders"
  | "payments"
  | "payment_totals"
  | "payment_settings"
  | "settings"
  | "invite_staff"
  | "manage_staff";

export const PERMISSION_META: {
  key: StaffPermission;
  label: string;
  description: string;
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Store overview, charts, and quick stats",
  },
  {
    key: "customers",
    label: "Customers",
    description: "View customer accounts and order history",
  },
  {
    key: "admins",
    label: "Staff list",
    description: "See staff accounts in User Management",
  },
  {
    key: "invite_staff",
    label: "Invite staff",
    description: "Send invite emails for new staff accounts",
  },
  {
    key: "manage_staff",
    label: "Manage staff",
    description: "Suspend, reactivate, delete, or change staff roles (Super Admin)",
  },
  {
    key: "products",
    label: "Products",
    description: "Create, edit, restock, and remove catalog items",
  },
  {
    key: "orders",
    label: "Orders",
    description: "View orders, update status, print invoices / waybills",
  },
  {
    key: "payments",
    label: "Payments",
    description: "See payment records and verify bank transfers",
  },
  {
    key: "payment_totals",
    label: "Payment totals",
    description: "See revenue totals on the payments page",
  },
  {
    key: "payment_settings",
    label: "Payment settings",
    description: "Turn Paystack / bank transfer on or off",
  },
  {
    key: "settings",
    label: "Store settings",
    description: "Store name, address, fees, and notification email",
  },
];

const PERMS: Record<StaffRole, StaffPermission[]> = {
  support: ["customers", "orders", "payments"],
  admin: [
    "dashboard",
    "customers",
    "admins",
    "products",
    "orders",
    "payments",
    "payment_totals",
    "settings",
    "invite_staff",
  ],
  super_admin: [
    "dashboard",
    "customers",
    "admins",
    "products",
    "orders",
    "payments",
    "payment_totals",
    "payment_settings",
    "settings",
    "invite_staff",
    "manage_staff",
  ],
};

export function permissionsFor(role: string | undefined | null): StaffPermission[] {
  if (!isStaffRole(role)) return [];
  return PERMS[role];
}

export function can(role: string | undefined | null, permission: StaffPermission): boolean {
  return permissionsFor(role).includes(permission);
}

/** First page a staff user should land on after login. */
export function homePathForRole(role: string | undefined | null): string {
  if (can(role, "dashboard")) return "/dashboard";
  if (can(role, "orders")) return "/orders";
  return "/login";
}
