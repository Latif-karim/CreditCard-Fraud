"use client";

import { FormEvent, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string>("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setResult("Signing in...");
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult(data.error || "Login failed");
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);
      setResult("Login successful. Open /dashboard.");
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto mt-10 max-w-md">
        <div className="glass-card p-6">
          <p className="text-soft text-xs uppercase tracking-[0.25em]">Secure Access</p>
          <h1 className="mb-5 mt-2 text-3xl font-semibold">Welcome back</h1>
          <form onSubmit={onSubmit}>
            <label className="text-sm">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none transition focus:border-slate-500"
            />
            <label className="mt-4 block text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none transition focus:border-slate-500"
            />
            <button
              type="submit"
              className="mt-5 w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              Sign In
            </button>
            <p className="text-soft mt-3 text-sm">{result}</p>
          </form>
        </div>
      </div>
    </main>
  );
}
