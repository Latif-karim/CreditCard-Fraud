"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { TransactionNotificationProvider } from "@/components/transaction-notification-provider";
import { AuthError, fetchWithAuth, getStoredToken } from "@/lib/api";
import { clearClientSession, mirrorSessionCookieFromStorage, setClientSession } from "@/lib/auth-session";

type GateState = "checking" | "allowed" | "denied";

type MeResponse = {
  id: number;
  email: string;
  role: string;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [gate, setGate] = useState<GateState>("checking");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const token = getStoredToken();
      if (!token) {
        clearClientSession();
        if (!cancelled) {
          const next = pathname.startsWith("/") ? pathname : "/dashboard";
          router.replace(`/login?next=${encodeURIComponent(next)}`);
          setGate("denied");
        }
        return;
      }

      try {
        const me = await fetchWithAuth<MeResponse>("/auth/me", token);
        if (cancelled) return;
        setClientSession(token, me.role, me.id);
        mirrorSessionCookieFromStorage();
        setGate("allowed");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) {
          setGate("denied");
          return;
        }
        clearClientSession();
        const next = pathname.startsWith("/") ? pathname : "/dashboard";
        router.replace(`/login?next=${encodeURIComponent(next)}&reason=session_expired`);
        setGate("denied");
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (gate === "checking") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Verifying session…</p>
      </div>
    );
  }

  if (gate === "denied") {
    return null;
  }

  return <TransactionNotificationProvider>{children}</TransactionNotificationProvider>;
}
