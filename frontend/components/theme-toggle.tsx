"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  /** `ghost` for headers; softer border and fade. */
  variant?: "solid" | "ghost";
  className?: string;
};

export function ThemeToggle({ variant = "solid", className = "" }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <span className={`inline-block h-9 w-9 shrink-0 rounded-lg ${className}`} aria-hidden />;
  }
  const isDark = resolvedTheme === "dark";
  const base =
    variant === "ghost"
      ? "border border-slate-200/70 bg-white/30 p-2 text-slate-600 shadow-none backdrop-blur-md transition-all duration-500 ease-out hover:border-slate-300/80 hover:bg-white/55 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-white/15 dark:hover:bg-white/[0.1] dark:hover:text-white"
      : "border border-slate-200/80 bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-500 ease-out hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`rounded-lg ${base} ${className}`}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span className="block transition-opacity duration-500 ease-out">
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </span>
    </button>
  );
}
