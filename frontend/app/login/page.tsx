"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthDivider, AuthPageShell, authBtnClass, authFieldClass, authLabelClass } from "@/components/auth-page-shell";
import { SocialLoginButtons, getOAuthErrorMessage } from "@/components/social-login-buttons";
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
    const oauthErr = getOAuthErrorMessage(qs.get("error"));
    if (oauthErr) setResult(oauthErr);

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
        setResult(
          data.social_login
            ? data.error || "Use Google or GitHub to sign in to this account."
            : detail || data.error || "Login failed"
        );
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
    <AuthPageShell
      title="Welcome back"
      subtitle={
        <>
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-sky-700 underline decoration-sky-700/30 underline-offset-2 dark:text-sky-400"
          >
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={authLabelClass}>Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authFieldClass}
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className={authLabelClass}>Password</label>
            <Link
              href="/forgot-password"
              className="text-[0.65rem] text-sky-700 underline decoration-sky-700/25 dark:text-sky-400"
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authFieldClass}
          />
        </div>
        <button type="submit" className={authBtnClass}>
          Sign in
        </button>
        {result ? <p className="text-soft line-clamp-2 text-xs leading-snug">{result}</p> : null}
      </form>
      <AuthDivider />
      <SocialLoginButtons />
    </AuthPageShell>
  );
}
