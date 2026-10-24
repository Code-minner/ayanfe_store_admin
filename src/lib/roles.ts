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

/** Pages / nav sections gated by role. */
export type StaffPermission =
  | "dashboard"
  | "customers"
  | "admins"
  | "products"
  | "orders"
  | "payments"
  | "payment_totals"
  | "settings"
  | "invite_staff";

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
    "settings",
    "invite_staff",
  ],
};

export function can(role: string | undefined | null, permission: StaffPermission): boolean {
  if (!isStaffRole(role)) return false;
  return PERMS[role].includes(permission);
}

/** First page a staff user should land on after login. */
export function homePathForRole(role: string | undefined | null): string {
  if (can(role, "dashboard")) return "/dashboard";
  if (can(role, "orders")) return "/orders";
  return "/login";
}
