export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  registeredAt: string;
  orders: number;
  status: "Active" | "Suspended";
  firstName: string;
  lastName: string;
};

export type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  dateAdded: string;
  status: "Active" | "Inactive";
  lastActive: string;
};

export type RoleRow = {
  id: string;
  title: string;
  permissions: string[];
};

export const PERMISSIONS = [
  "KYC Approval",
  "Edit User",
  "Create Admins",
  "Remove Admins",
  "Create Roles",
  "Read Products",
  "Delete Products",
  "Approve Products",
  "Suspend Customer",
] as const;

const allPerms = [...PERMISSIONS];

export const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 8 }, (_, i) => ({
  id: `cust-${i + 1}`,
  name: "John Doe",
  firstName: "John",
  lastName: "Doe",
  email: "johndoe@gmail.com",
  phone: "08123456789",
  avatarUrl: `https://i.pravatar.cc/80?img=${i + 10}`,
  registeredAt: "2025-05-01",
  orders: 312,
  status: i === 1 ? "Suspended" : "Active",
}));

export const MOCK_ADMINS: AdminRow[] = [
  {
    id: "adm-1",
    name: "John Doe",
    email: "john@example.com",
    role: "Super admin",
    dateAdded: "2025-05-01",
    status: "Active",
    lastActive: "2025-06-01",
  },
  {
    id: "adm-2",
    name: "John Doe",
    email: "john@example.com",
    role: "Customer support",
    dateAdded: "2025-05-01",
    status: "Active",
    lastActive: "2025-06-01",
  },
  {
    id: "adm-3",
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    dateAdded: "2025-05-01",
    status: "Active",
    lastActive: "2025-06-01",
  },
  {
    id: "adm-4",
    name: "John Doe",
    email: "john@example.com",
    role: "Compliance",
    dateAdded: "2025-05-01",
    status: "Inactive",
    lastActive: "2025-06-01",
  },
  {
    id: "adm-5",
    name: "John Doe",
    email: "john@example.com",
    role: "Reviewer",
    dateAdded: "2025-05-01",
    status: "Active",
    lastActive: "2025-06-01",
  },
];

export const MOCK_ROLES: RoleRow[] = [
  "Super Admin",
  "Admin",
  "Compliance",
  "Customer Support",
  "Reviewer",
].map((title, i) => ({
  id: `role-${i + 1}`,
  title,
  permissions: allPerms,
}));

export const DASHBOARD_STATS = {
  customers: 163,
  sellers: 54,
  admins: 4,
  activeProducts: 342,
  ordersTotal: 2025,
  transactionsTotal: 450000,
  customersChart: [1200, 1800, 2100, 2800, 5172, 4200, 3900, 4100, 4500, 4800, 5000, 5300],
};
