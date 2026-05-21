"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { TransactionNotificationProvider } from "@/components/transaction-notification-provider";
import { fetchWithAuth, getStoredToken } from "@/lib/api";
import { clearClientSession, mirrorSessionCookieFromStorage, setClientSession } from "@/lib/auth-session";

type MeResponse = {
  id: number;
  email: string;
  role: string;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const token = getStoredToken();
    if (!token) {
      clearClientSession();
      const next = pathname.startsWith("/") ? pathname : "/dashboard";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    void (async () => {
      try {
        const me = await fetchWithAuth<MeResponse>("/auth/me", token);
        if (cancelled) return;
        setClientSession(token, me.role, me.id);
        mirrorSessionCookieFromStorage();
      } catch {
        if (cancelled) return;
        clearClientSession();
        const next = pathname.startsWith("/") ? pathname : "/dashboard";
        router.replace(`/login?next=${encodeURIComponent(next)}&reason=session_expired`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <TransactionNotificationProvider>{children}</TransactionNotificationProvider>;
}
