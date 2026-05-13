"use client";

import Link from "next/link";

import { useClientSession } from "@/lib/use-client-session";

export function LandingTeamCtas() {
  const { loggedIn } = useClientSession();

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/dashboard/monitoring"
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition-opacity duration-300 hover:opacity-90 dark:bg-white dark:text-slate-900"
      >
        View monitoring
      </Link>
      {loggedIn ? (
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 transition-all duration-300 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800/50"
        >
          Open dashboard
        </Link>
      ) : (
        <Link
          href="/login"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 transition-all duration-300 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800/50"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}
