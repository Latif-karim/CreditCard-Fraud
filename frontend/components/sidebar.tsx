"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CreditCard,
  FileText,
  PlusCircle,
  LayoutDashboard,
  LineChart,
  LogIn,
  LogOut,
  Radar,
  Shield,
  UserCog,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SidebarNavSkeleton } from "@/components/skeletons";
import { ROLE_LABELS, navForRole, type NavItem } from "@/lib/roles";
import { useClientSession } from "@/lib/use-client-session";
import { useHydrated } from "@/lib/use-hydrated";
import { useUserRole } from "@/lib/use-user-role";

const ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/monitoring": Activity,
  "/dashboard/capture": PlusCircle,
  "/dashboard/transactions": CreditCard,
  "/dashboard/fraud": Brain,
  "/dashboard/explain": LineChart,
  "/dashboard/analytics": BarChart3,
  "/dashboard/alerts": Bell,
  "/dashboard/reports": FileText,
  "/dashboard/admin": UserCog,
  "/dashboard/profile": UserRound,
};

function NavLink({ href, label }: NavItem) {
  const pathname = usePathname();
  const Icon = ICONS[href] || LayoutDashboard;
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-slate-900 font-medium text-white shadow-sm dark:bg-slate-800"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
      }`}
    >
      <Icon className="mr-2 h-4 w-4 shrink-0 opacity-80" />
      {label}
    </Link>
  );
}

function AccountNav() {
  const pathname = usePathname();
  const { loggedIn, logout } = useClientSession();

  if (loggedIn) {
    return (
      <button
        type="button"
        onClick={() => logout()}
        className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
      >
        <LogOut className="mr-2 h-4 w-4 shrink-0 opacity-80" />
        Sign out
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition ${
        pathname === "/login"
          ? "bg-slate-900 font-medium text-white shadow-sm dark:bg-slate-800"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
      }`}
    >
      <LogIn className="mr-2 h-4 w-4 shrink-0 opacity-80" />
      Sign in
    </Link>
  );
}

export function Sidebar({ className = "" }: { className?: string }) {
  const hydrated = useHydrated();
  const role = useUserRole();
  const { workspace, admin } = navForRole(role);

  if (!hydrated) {
    return <SidebarNavSkeleton className={className} />;
  }

  return (
    <aside
      className={`flex flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85 ${className}`}
    >
      <div className="px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <Radar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">FraudShield</h2>
            <p className="text-soft text-[10px] font-medium uppercase tracking-wider">
              {role ? ROLE_LABELS[role] : "Operations"}
            </p>
          </div>
        </div>

        <nav className="mt-8 space-y-6">
          {workspace.length > 0 ? (
            <div>
              <p className="text-soft mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider">Workspace</p>
              <div className="grid gap-1">
                {workspace.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </div>
          ) : null}
          {admin.length > 0 ? (
            <div>
              <p className="text-soft mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider">Administration</p>
              <div className="grid gap-1">
                {admin.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <p className="text-soft mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider">Account</p>
            <div className="grid gap-1">
              <AccountNav />
            </div>
          </div>
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="glass-card flex items-start gap-2 p-3 text-xs">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-medium text-slate-800 dark:text-white">RBAC active</p>
            <p className="text-soft mt-0.5 leading-relaxed">
              Navigation and APIs adapt to {role ? ROLE_LABELS[role].toLowerCase() : "your"} permissions.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
