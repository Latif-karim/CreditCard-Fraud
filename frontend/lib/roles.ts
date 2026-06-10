export type AppRole = "analyst" | "admin";

export const ROLE_LABELS: Record<AppRole, string> = {
  analyst: "Fraud Analyst",
  admin: "Administrator",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  analyst: "Monitor payment streams, investigate alerts, analyze risk, and export evidence packs.",
  admin: "Full platform control: users, rules, model operations, and global analytics.",
};

export type NavItem = {
  href: string;
  label: string;
  roles: AppRole[];
};

export const WORKSPACE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", roles: ["analyst", "admin"] },
  { href: "/dashboard/monitoring", label: "Live monitoring", roles: ["analyst", "admin"] },
  { href: "/dashboard/capture", label: "Transaction ingest", roles: ["analyst", "admin"] },
  { href: "/dashboard/transactions", label: "Flagged queue", roles: ["analyst", "admin"] },
  { href: "/dashboard/disputes", label: "Disputes", roles: ["analyst", "admin"] },
  { href: "/dashboard/fraud", label: "Risk lab", roles: ["analyst", "admin"] },
  { href: "/dashboard/explain", label: "Explainability", roles: ["analyst", "admin"] },
  { href: "/dashboard/analytics", label: "Analytics", roles: ["analyst", "admin"] },
  { href: "/dashboard/alerts", label: "Alerts", roles: ["analyst", "admin"] },
  { href: "/dashboard/reports", label: "Reports", roles: ["analyst", "admin"] },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard/admin", label: "Admin console", roles: ["admin"] },
  { href: "/dashboard/profile", label: "Profile & security", roles: ["analyst", "admin"] },
];

export function parseRole(value: string | null | undefined): AppRole | null {
  if (value === "analyst" || value === "admin") return value;
  return null;
}

export function canAccessRoute(role: AppRole | null, href: string): boolean {
  if (!role) return false;
  const all = [...WORKSPACE_NAV, ...ADMIN_NAV];
  const item = all.find((n) => n.href === href || (href.startsWith(n.href) && n.href !== "/dashboard"));
  if (!item) return true;
  return item.roles.includes(role);
}

export function navForRole(role: AppRole | null): { workspace: NavItem[]; admin: NavItem[] } {
  if (!role) return { workspace: [], admin: [] };
  return {
    workspace: WORKSPACE_NAV.filter((n) => n.roles.includes(role)),
    admin: ADMIN_NAV.filter((n) => n.roles.includes(role)),
  };
}
