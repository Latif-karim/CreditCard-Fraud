"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getApiBase } from "@/lib/api";
import { mirrorSessionCookieFromStorage, setClientSession } from "@/lib/auth-session";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"user" | "analyst">("user");
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
    const res = await fetch(`${getApiBase()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Registration failed");
      return;
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
  };

  return (
    <main className="min-h-screen px-4 py-10 transition-opacity duration-500">
      <div className="mx-auto max-w-md">
        <p className="text-soft mb-6 text-center text-xs uppercase tracking-[0.2em]">Create account</p>
        <div className="glass-card p-6 shadow-xl shadow-slate-200/30 dark:shadow-black/20">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Register</h1>
          <p className="text-soft mt-2 text-sm">
            Already have access?{" "}
            <Link href="/login" className="font-medium text-sky-700 underline decoration-sky-700/30 underline-offset-2 dark:text-sky-400">
              Sign in
            </Link>
          </p>
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <div>
              <label className="text-sm">Full name</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm">Email</label>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm">Password (8+ chars)</label>
              <input
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm">Role</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={role}
                onChange={(e) => setRole(e.target.value as "user" | "analyst")}
              >
                <option value="user">Normal user</option>
                <option value="analyst">Analyst</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition-opacity duration-300 hover:opacity-90 dark:bg-white dark:text-slate-900"
            >
              Create account
            </button>
            {msg ? <p className="text-soft text-sm">{msg}</p> : null}
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
