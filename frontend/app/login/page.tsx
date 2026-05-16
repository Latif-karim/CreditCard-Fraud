"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthError, fetchWithAuth, getApiBase, getStoredToken } from "@/lib/api";
import { clearClientSession, setClientSession } from "@/lib/auth-session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    if (qs.get("reason") === "session_expired") {
      clearClientSession();
      setResult("Your session expired. Please sign in again.");
      return;
    }
    const token = getStoredToken();
    if (!token) return;

    void (async () => {
      try {
        await fetchWithAuth("/auth/me", token);
        const next = qs.get("next");
        const dest = next && next.startsWith("/dashboard") ? next : "/dashboard";
        router.replace(dest);
      } catch (err) {
        if (!(err instanceof AuthError)) {
          clearClientSession();
        }
      }
    })();
  }, [router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setResult("Signing in...");
    try {
      const response = await fetch(`${getApiBase()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        const detail =
          data.details?.email?.[0] ||
          (data.details ? JSON.stringify(data.details) : null);
        setResult(detail || data.error || "Login failed");
        return;
      }
      setClientSession(data.access_token, data.role, data.user_id);
      setResult("");
      const qs = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const next = qs?.get("next");
      const dest = next && next.startsWith("/dashboard") ? next : "/dashboard";
      router.push(dest);
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 transition-opacity duration-500">
      <div className="mx-auto max-w-md">
        <p className="text-soft mb-6 text-center text-xs uppercase tracking-[0.2em]">Secure access</p>
        <div className="glass-card p-6 shadow-xl shadow-slate-200/30 dark:shadow-black/20">
          <h1 className="mb-2 text-3xl font-semibold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-soft mb-5 text-sm">
            No account?{" "}
            <Link href="/register" className="font-medium text-sky-700 underline decoration-sky-700/30 underline-offset-2 transition hover:decoration-sky-700 dark:text-sky-400 dark:decoration-sky-400/30">
              Register
            </Link>
          </p>
          <form onSubmit={onSubmit}>
            <label className="text-sm text-slate-700 dark:text-slate-200">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
            />
            <label className="mt-4 block text-sm text-slate-700 dark:text-slate-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-xs text-sky-700 underline decoration-sky-700/25 underline-offset-2 dark:text-sky-400">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity duration-300 hover:opacity-90 dark:bg-white dark:text-slate-900"
            >
              Sign in
            </button>
            {result ? <p className="text-soft mt-3 text-sm">{result}</p> : null}
          </form>
        </div>
        <p className="text-soft mt-8 text-center text-xs">
          <Link href="/" className="transition hover:text-slate-600 dark:hover:text-slate-300">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
