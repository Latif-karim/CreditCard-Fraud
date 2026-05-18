"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn, LogOut, Shield } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { useClientSession } from "@/lib/use-client-session";

export function LandingNav() {
  const { loggedIn, logout } = useClientSession();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl transition-colors duration-500 dark:border-slate-800/80 dark:bg-slate-950/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">FraudShield</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <a href="#how" className="transition-colors duration-300 hover:text-slate-900 dark:hover:text-white">
            How it works
          </a>
          <a href="#stats" className="transition-colors duration-300 hover:text-slate-900 dark:hover:text-white">
            Impact
          </a>
          <a href="#demo" className="transition-colors duration-300 hover:text-slate-900 dark:hover:text-white">
            Product
          </a>
          <a href="#get-started" className="transition-colors duration-300 hover:text-slate-900 dark:hover:text-white">
            Get started
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle variant="ghost" />
          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200/90 bg-white/60 p-2 text-slate-800 shadow-sm transition-all duration-300 hover:bg-white sm:hidden dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                aria-label="Open dashboard"
              >
                <LayoutDashboard className="h-4 w-4 opacity-80" />
              </Link>
              <Link
                href="/dashboard"
                className="hidden rounded-lg border border-slate-200/90 bg-white/60 px-3 py-2 text-sm text-slate-800 shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:border-slate-600 sm:inline-block"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-transparent px-3 py-2 text-sm text-slate-700 transition-all duration-300 hover:bg-slate-100/80 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/80"
              >
                <LogOut className="h-3.5 w-3.5 opacity-70" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200/90 bg-white/50 p-2 text-slate-800 transition-all duration-300 hover:bg-white sm:hidden dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100"
                aria-label="Sign in"
              >
                <LogIn className="h-4 w-4 opacity-80" />
              </Link>
              <Link
                href="/login"
                className="hidden items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/50 px-3 py-2 text-sm text-slate-800 transition-all duration-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-900 sm:inline-flex"
              >
                <LogIn className="h-3.5 w-3.5 opacity-70" />
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity duration-300 hover:opacity-90 dark:bg-white dark:text-slate-900"
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
