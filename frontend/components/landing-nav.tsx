"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn, LogOut, Shield } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { useClientSession } from "@/lib/use-client-session";
import { useHydrated } from "@/lib/use-hydrated";

export function LandingNav() {
  const hydrated = useHydrated();
  const { loggedIn, logout } = useClientSession();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">FraudShield</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle variant="ghost" />
          {!hydrated ? (
            <span className="inline-block h-9 w-20 shrink-0 rounded-lg bg-slate-200/60 dark:bg-slate-800/60" aria-hidden />
          ) : loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:text-slate-900 sm:inline-flex dark:text-slate-200 dark:hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
