"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { canAccessRoute, ROLE_LABELS, type AppRole } from "@/lib/roles";
import { useUserRole } from "@/lib/use-user-role";

type RoleGuardProps = {
  allow: AppRole[];
  children: React.ReactNode;
  title?: string;
};

export function RoleGuard({ allow, children, title = "Access restricted" }: RoleGuardProps) {
  const role = useUserRole();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!role) return;
    if (!canAccessRoute(role, pathname)) {
      router.replace("/dashboard");
    }
  }, [role, pathname, router]);

  if (!role) {
    return (
      <AppShell title={title} subtitle="Loading">
        <p className="text-sm text-slate-500">Loading permissions…</p>
      </AppShell>
    );
  }

  if (!allow.includes(role)) {
    const needed = allow.map((r) => ROLE_LABELS[r]).join(" or ");
    return (
      <AppShell title={title} subtitle="Role required">
        <div className="fintech-panel max-w-lg p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This module requires <strong>{needed}</strong> access. You are signed in as{" "}
            <strong>{ROLE_LABELS[role]}</strong>.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-sky-700 underline dark:text-sky-400"
          >
            Return to overview
          </Link>
        </div>
      </AppShell>
    );
  }

  return <>{children}</>;
}
