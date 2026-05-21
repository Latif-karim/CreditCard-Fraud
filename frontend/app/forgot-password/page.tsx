"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getApiBase } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${getApiBase()}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMsg(
      data.message ||
        "If an account exists for this email, you will receive a verification code shortly."
    );
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="glass-card p-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Forgot password</h1>
          <p className="text-soft mt-2 text-sm">
            After submitting, use{" "}
            <Link href="/verify-otp" className="text-sky-700 underline dark:text-sky-400">
              OTP verification
            </Link>{" "}
            then{" "}
            <Link href="/reset-password" className="text-sky-700 underline dark:text-sky-400">
              reset password
            </Link>
            .
          </p>
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <input
              type="email"
              required
              placeholder="Email"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="w-full rounded-lg bg-slate-900 py-2 text-sm text-white dark:bg-white dark:text-slate-900">
              Send OTP
            </button>
          </form>
          <p className="text-soft mt-3 text-sm">{msg}</p>
          <Link href="/login" className="mt-4 inline-block text-sm text-sky-700 underline dark:text-sky-400">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
