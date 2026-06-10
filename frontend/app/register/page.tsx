"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthPageShell, authBtnClass, authFieldClass, authLabelClass } from "@/components/auth-page-shell";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import { getApiBase } from "@/lib/api";
import { mirrorSessionCookieFromStorage, setClientSession } from "@/lib/auth-session";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";

type RegisterTab = "email" | "social";

export default function RegisterPage() {
  const router = useRouter();
  const [tab, setTab] = useState<RegisterTab>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("analyst");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    mirrorSessionCookieFromStorage();
    router.replace("/dashboard");
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("Creating account…");
    try {
      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.details?.email?.[0] || data.details?.role?.[0];
        setMsg(detail || data.error || "Registration failed");
        return;
      }
      if (data.awaiting_approval) {
        setMsg(data.message || "Access request submitted. An administrator must approve your workspace.");
      }

      const loginRes = await fetch(`${getApiBase()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.access_token) {
        setClientSession(loginData.access_token, loginData.role, loginData.user_id);
        router.push("/dashboard");
        return;
      }

      router.push("/login");
    } catch {
      setMsg("We couldn't create your account right now. Please try again.");
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 rounded px-2 py-1.5 text-xs font-medium transition ${
      active
        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
        : "text-slate-500 dark:text-slate-400"
    }`;

  return (
    <AuthPageShell
      tall
      title="Request operations access"
      subtitle={
        <>
          Have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-sky-700 underline decoration-sky-700/25 dark:text-sky-400"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-3 flex gap-1 rounded-md border border-slate-200/80 bg-slate-50 p-1 dark:border-slate-700/50 dark:bg-slate-800/50">
        <button type="button" onClick={() => setTab("email")} className={tabClass(tab === "email")}>
          Email
        </button>
        <button type="button" onClick={() => setTab("social")} className={tabClass(tab === "social")}>
          Social
        </button>
      </div>

      {tab === "email" ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className={authLabelClass}>Full name</label>
            <input
              className={authFieldClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label className={authLabelClass}>Email</label>
            <input
              type="email"
              required
              className={authFieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className={authLabelClass}>Password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="8+ characters"
              className={authFieldClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={authLabelClass}>Operations role</label>
            <select
              className={authFieldClass}
              value={role}
              title="Choose analyst or administrator access"
              onChange={(e) => setRole(e.target.value as AppRole)}
            >
              <option value="analyst">{ROLE_LABELS.analyst}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
            </select>
            <p className="text-soft mt-1 text-[0.65rem] leading-snug">
              New accounts require administrator approval before accessing the fraud operations console.
            </p>
          </div>
          <button type="submit" className={authBtnClass}>
            Submit access request
          </button>
          {msg ? <p className="text-soft line-clamp-2 text-[0.65rem]">{msg}</p> : null}
          <button
            type="button"
            onClick={() => setTab("social")}
            className="w-full text-center text-[0.6rem] text-sky-700 underline decoration-sky-700/20 dark:text-sky-400"
          >
            Or Google / GitHub
          </button>
        </form>
      ) : (
        <div className="space-y-4 py-2">
          <p className="text-soft text-xs leading-relaxed">
            Social sign-in creates a pending analyst workspace. An administrator must approve access before you can
            ingest or investigate transactions.
          </p>
          <SocialLoginButtons />
        </div>
      )}
    </AuthPageShell>
  );
}
