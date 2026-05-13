"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { clearClientSession, mirrorSessionCookieFromStorage } from "@/lib/auth-session";

type GateState = "checking" | "allowed" | "denied";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [gate, setGate] = useState<GateState>("checking");

  useEffect(() => {
    mirrorSessionCookieFromStorage();
    const token = localStorage.getItem("access_token");
    if (!token) {
      clearClientSession();
      const next = pathname.startsWith("/") ? pathname : "/dashboard";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      setGate("denied");
      return;
    }
    setGate("allowed");
  }, [pathname, router]);

  if (gate === "checking") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Checking session…</p>
      </div>
    );
  }

  if (gate === "denied") {
    return null;
  }

  return <>{children}</>;
}
