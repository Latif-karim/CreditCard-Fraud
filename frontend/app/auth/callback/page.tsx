"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getOAuthErrorMessage } from "@/components/social-login-buttons";
import { setClientSession } from "@/lib/auth-session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const error = qs.get("error");
    if (error) {
      setMessage(getOAuthErrorMessage(error) ?? "Sign-in failed.");
      return;
    }

    const token = qs.get("access_token");
    const role = qs.get("role");
    const userId = qs.get("user_id");

    if (!token || !role) {
      setMessage("Missing sign-in data. Please try again from the login page.");
      return;
    }

    setClientSession(token, role, userId ? Number(userId) : undefined);
    const next = sessionStorage.getItem("oauth_next");
    sessionStorage.removeItem("oauth_next");
    const dest = next && next.startsWith("/dashboard") ? next : "/dashboard";
    router.replace(dest);
  }, [router]);

  const failed = message !== "Completing sign-in…";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-6 text-center">
        <p className="text-sm text-slate-700 dark:text-slate-200">{message}</p>
        {failed ? (
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-sky-700 underline dark:text-sky-400"
          >
            Back to sign in
          </Link>
        ) : null}
      </div>
    </main>
  );
}
