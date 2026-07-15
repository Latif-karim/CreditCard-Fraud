"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Shield } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { useClientSession } from "@/lib/use-client-session";
import { useHydrated } from "@/lib/use-hydrated";

const NAV_LINK =
  "hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline-flex dark:text-slate-400 dark:hover:text-white";

export function LandingNav() {
  const hydrated = useHydrated();
  const { loggedIn, logout } = useClientSession();

  const linkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white";

  const primaryClass =
    "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900";

  return (
    <header className="flex items-center justify-between pt-6 pb-8">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
          <Shield className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">FraudShield</span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-2">
        {!loggedIn && (
          <>
            <a href="#how-it-works" className={NAV_LINK}>
              How it works
            </a>
            <a href="#roles" className={NAV_LINK}>
              Roles
            </a>
          </>
        )}
        <ThemeToggle variant="ghost" />
        {!hydrated ? (
          <span className="inline-block h-9 w-16 rounded-lg bg-slate-200/50 dark:bg-slate-800/50" aria-hidden />
        ) : loggedIn ? (
          <>
            <Link href="/dashboard" className={`${linkClass} inline-flex items-center gap-1.5`}>
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button type="button" onClick={() => logout()} className={linkClass}>
              <span className="hidden sm:inline">Sign out</span>
              <LogOut className="h-4 w-4 sm:hidden" />
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={`${linkClass} hidden sm:inline-flex`}>
              Sign in
            </Link>
            <Link href="/register" className={primaryClass}>
              Request access
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
