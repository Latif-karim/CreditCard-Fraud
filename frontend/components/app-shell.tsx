"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Sidebar } from "@/components/sidebar";

import { NotificationSoundToggle } from "@/components/transaction-notification-provider";
import { ThemeToggle } from "@/components/theme-toggle";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="grid h-screen overflow-hidden md:grid-cols-[250px_1fr]">
      <Sidebar className="hidden h-screen overflow-y-auto md:block" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)}>
          <Sidebar className="h-screen w-72 overflow-y-auto" />
        </div>
      ) : null}

      <main className="h-screen min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6">
        <header className="fintech-panel mb-5 flex items-center justify-between gap-3 p-4 md:p-5">
          <div className="min-w-0">
            <p className="text-soft text-xs uppercase tracking-[0.2em]">{subtitle}</p>
            <h1 className="mt-1 truncate text-xl font-semibold md:text-2xl">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationSoundToggle />
            <ThemeToggle variant="ghost" />
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="rounded-lg border border-slate-200/90 bg-white/70 p-2 text-slate-800 shadow-sm transition-all duration-300 hover:bg-white md:hidden dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
