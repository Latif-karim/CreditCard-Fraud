"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Mail } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { ListSkeleton } from "@/components/skeletons";
import { fetchWithAuth, patchWithAuth } from "@/lib/api";
import { type LiveStreamEvent } from "@/lib/live-updates";
import { notificationHref } from "@/lib/notification-links";
import { useUserRole } from "@/lib/use-user-role";
import { useHydrated } from "@/lib/use-hydrated";
import { useLiveEvent } from "@/lib/use-live-event";
import type { FraudNotification } from "@/lib/types";

export default function AlertsPage() {
  const role = useUserRole();
  const hydrated = useHydrated();
  const [items, setItems] = useState<FraudNotification[]>([]);
  const [emails, setEmails] = useState<{ id: number; recipient: string; status: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem("access_token") || "";
    if (!token) return;
    try {
      const [notifs, log] = await Promise.all([
        fetchWithAuth<FraudNotification[]>("/alerts/notifications", token).catch(
          () => [] as FraudNotification[]
        ),
        fetchWithAuth<{ id: number; recipient: string; status: string; created_at: string }[]>(
          "/alerts/email-log",
          token
        ).catch(() => [] as { id: number; recipient: string; status: string; created_at: string }[]),
      ]);
      setItems(notifs);
      setEmails(log);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setLoading(true);
    void load();
  }, [hydrated, load]);

  useLiveEvent(
    useCallback((event: LiveStreamEvent) => {
      if (event.type === "transaction.created" && event.notification) {
        setItems((prev) => {
          if (prev.some((n) => n.id === event.notification!.id)) return prev;
          return [event.notification!, ...prev];
        });
      }
    }, []),
    hydrated
  );

  const mark = async (id: number, read: boolean) => {
    const token = localStorage.getItem("access_token") || "";
    await patchWithAuth(`/alerts/notifications/${id}/read`, { read }, token);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
  };

  const sevColor = (s: string) => {
    if (s === "critical") return "border-red-500 text-red-700 dark:text-red-400";
    if (s === "high") return "border-amber-500 text-amber-800 dark:text-amber-300";
    return "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200";
  };

  return (
    <RoleGuard allow={["analyst", "admin"]} title="Alerts">
    <AppShell title="Alerts & notifications" subtitle="Fraud operations inbox">
      {!hydrated || loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ListSkeleton items={4} />
          <ListSkeleton items={4} />
        </div>
      ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-4">
          <h3 className="mb-3 text-base font-semibold">In-app fraud alerts</h3>
          <div className="space-y-3">
            {items.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border-l-4 bg-white/80 p-3 dark:bg-slate-900/60 ${sevColor(n.severity)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={notificationHref(n, role)} className="min-w-0 flex-1 transition hover:opacity-90">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-soft mt-1 text-xs">{n.body}</p>
                    <p className="text-soft mt-2 flex items-center gap-1 text-[10px] uppercase">
                      {n.category} · {n.severity} · {new Date(n.created_at).toLocaleString()}
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </p>
                  </Link>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-sky-700 underline dark:text-sky-400"
                    onClick={() => void mark(n.id, !n.read)}
                  >
                    {n.read ? "Mark unread" : "Mark read"}
                  </button>
                </div>
              </div>
            ))}
            {!items.length ? <p className="text-soft text-sm">No alerts yet.</p> : null}
          </div>
        </div>
        <div className="glass-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Mail className="h-4 w-4" />
            Email delivery log
          </h3>
          <ul className="space-y-2 text-sm">
            {emails.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span className="font-medium">{e.recipient}</span>{" "}
                <span className="text-soft text-xs">· {e.status}</span>
                <div className="text-soft text-xs">{new Date(e.created_at).toLocaleString()}</div>
              </li>
            ))}
            {!emails.length ? <p className="text-soft text-sm">No email sends logged.</p> : null}
          </ul>
        </div>
      </div>
      )}
    </AppShell>
    </RoleGuard>
  );
}
