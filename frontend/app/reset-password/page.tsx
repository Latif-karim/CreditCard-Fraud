"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getApiBase } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${getApiBase()}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
    const data = await res.json();
    setMsg(data.message || data.error || "Done");
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="glass-card p-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Reset password</h1>
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <input
              type="email"
              required
              placeholder="Email"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              required
              placeholder="OTP from email"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="New password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button type="submit" className="w-full rounded-lg bg-slate-900 py-2 text-sm text-white dark:bg-white dark:text-slate-900">
              Update password
            </button>
          </form>
          <p className="text-soft mt-3 text-sm">{msg}</p>
          <Link href="/login" className="text-sm text-sky-700 underline dark:text-sky-400">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
