"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Scale } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { ListSkeleton } from "@/components/skeletons";
import { fetchWithAuth, peekApiCache, postWithAuth } from "@/lib/api";
import { transactionDetailHref } from "@/lib/transaction-links";
import type { DisputeCaseRow } from "@/lib/types";

export default function DisputesPage() {
  const [items, setItems] = useState<DisputeCaseRow[]>(() => {
    if (typeof window === "undefined") return [];
    const token = localStorage.getItem("access_token") || "";
    return peekApiCache<DisputeCaseRow[]>("/disputes?status=open", token) ?? [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    const token = localStorage.getItem("access_token") || "";
    return peekApiCache("/disputes?status=open", token) === null;
  });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("access_token") || "";
    const hasCache = peekApiCache("/disputes?status=open", token) !== null;
    if (!hasCache) setLoading(true);
    try {
      const rows = await fetchWithAuth<DisputeCaseRow[]>("/disputes?status=open", token);
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (caseId: number, outcome: "approved" | "rejected") => {
    const token = localStorage.getItem("access_token") || "";
    setBusyId(caseId);
    setNotice("");
    try {
      await postWithAuth(
        `/disputes/${caseId}/resolve`,
        { outcome, resolution_note: outcome === "approved" ? "Customer dispute upheld." : "Fraud indicators confirmed." },
        token
      );
      setItems((prev) => prev.filter((c) => c.id !== caseId));
      setNotice(outcome === "approved" ? "Dispute approved — transaction marked safe." : "Dispute rejected — case remains flagged.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not resolve dispute.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <RoleGuard allow={["analyst", "admin"]} title="Disputes">
      <AppShell title="Dispute cases" subtitle="Cardholder review requests awaiting analyst decision">
        {notice ? (
          <p className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
            {notice}
          </p>
        ) : null}
        {loading ? (
          <ListSkeleton items={4} />
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <div key={c.id} className="glass-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <Scale className="h-4 w-4 text-amber-600" />
                      Case #{c.id} · {c.reason.replace(/_/g, " ")}
                    </p>
                    <p className="text-soft mt-1 text-xs">
                      {c.user_email ?? `User #${c.user_id}`} ·{" "}
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                    {c.customer_note ? (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{c.customer_note}</p>
                    ) : null}
                    {c.transaction ? (
                      <Link
                        href={transactionDetailHref(c.transaction.id)}
                        className="text-soft mt-2 inline-flex items-center gap-1 text-xs underline"
                      >
                        TX #{c.transaction.id} · ${c.transaction.amount.toFixed(2)} · {c.transaction.merchant || c.transaction.location}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => void resolve(c.id, "approved")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => void resolve(c.id, "rejected")}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!items.length ? (
              <p className="text-soft rounded-xl border border-slate-200 px-4 py-6 text-center text-sm dark:border-slate-800">
                No open dispute cases.
              </p>
            ) : null}
          </div>
        )}
      </AppShell>
    </RoleGuard>
  );
}
