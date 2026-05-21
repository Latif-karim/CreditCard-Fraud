"use client";

import Link from "next/link";

type AuthPageShellProps = {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  tall?: boolean;
};

export function AuthPageShell({ title, subtitle, children, tall = false }: AuthPageShellProps) {
  return (
    <main className="flex h-dvh max-h-dvh items-center justify-center overflow-hidden bg-slate-50 px-3 dark:bg-slate-950">
      <div className="w-full max-w-[21rem] shrink-0 sm:max-w-[23rem]">
        <div className="mb-2 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          <Link href="/" className="transition hover:text-slate-700 dark:hover:text-slate-200">
            ← Home
          </Link>
          <span>FraudShield</span>
        </div>

        <div className={`auth-card flex flex-col ${tall ? "auth-card-tall" : ""}`}>
          <header className="shrink-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            {subtitle ? <div className="text-soft mt-1.5 text-sm leading-relaxed">{subtitle}</div> : null}
          </header>
          <div className="mt-6 flex flex-1 flex-col justify-center gap-1">{children}</div>
        </div>
      </div>
    </main>
  );
}

export const authFieldClass =
  "mt-1 w-full rounded-md border border-slate-200/90 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700/80 dark:bg-slate-900/90";

export const authLabelClass = "text-xs font-medium text-slate-600 dark:text-slate-300";

export const authBtnClass =
  "mt-1 w-full rounded-md border-0 bg-slate-900 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900";

export function AuthDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200/80 dark:border-slate-700/60" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white/95 px-2 text-[0.65rem] uppercase tracking-wide text-slate-400 dark:bg-slate-900/95 dark:text-slate-500">
          or
        </span>
      </div>
    </div>
  );
}
