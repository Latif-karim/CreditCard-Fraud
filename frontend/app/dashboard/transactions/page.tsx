"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock3, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { CardGridSkeleton, TableSkeleton } from "@/components/skeletons";
import { fetchWithAuth } from "@/lib/api";
import {
  applyCreatedToOverview,
  toFlaggedTransaction,
  type LiveStreamEvent,
} from "@/lib/live-updates";
import { monitoringHref, transactionDetailHref } from "@/lib/transaction-links";
import { useLiveEvent } from "@/lib/use-live-event";
import type { DashboardOverview, FlaggedTransaction } from "@/lib/types";

const EMPTY_OVERVIEW: DashboardOverview = {
  total_transactions: 0,
  flagged_transactions: 0,
  approved_transactions: 0,
  fraud_rate: 0,
  total_volume: 0,
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem("access_token") || "";
    if (!token) return;
    try {
      const [txs, stats] = await Promise.all([
        fetchWithAuth<FlaggedTransaction[]>("/transactions/flagged", token).catch(() => []),
        fetchWithAuth<DashboardOverview>("/dashboard/overview", token).catch(() => null),
      ]);
      setTransactions(txs);
      setOverview(stats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useLiveEvent(
    useCallback((event: LiveStreamEvent) => {
      if (event.type === "transaction.created") {
        const tx = event.transaction;
        setOverview((prev) => applyCreatedToOverview(prev ?? EMPTY_OVERVIEW, tx));
        if (tx.status !== "flagged") return;
        setTransactions((prev) => {
          if (prev.some((f) => f.id === tx.id)) return prev;
          return [toFlaggedTransaction(tx), ...prev];
        });
        return;
      }
      if (event.type === "transaction.updated") {
        const tx = event.transaction;
        if (tx.status === "flagged") {
          setTransactions((prev) => {
            if (prev.some((f) => f.id === tx.id)) {
              return prev.map((f) => (f.id === tx.id ? toFlaggedTransaction(tx) : f));
            }
            return [toFlaggedTransaction(tx), ...prev];
          });
        } else {
          setTransactions((prev) => prev.filter((f) => f.id !== tx.id));
        }
      }
    }, []),
    true
  );

  const openCases = transactions.length;
  const flaggedRate = overview?.fraud_rate ?? 0;

  return (
    <RoleGuard allow={["analyst", "admin"]} title="Flagged queue">
    <AppShell title="Flagged Transactions" subtitle="Investigation Queue">
      {loading ? (
        <div className="space-y-5">
          <CardGridSkeleton cards={3} />
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoTile label="Open cases" value={String(openCases)} icon={ShieldAlert} />
          <InfoTile
            label="Flagged rate"
            value={`${(flaggedRate * 100).toFixed(2)}%`}
            icon={Clock3}
          />
          <InfoTile
            label="Captured transactions"
            value={String(overview?.total_transactions ?? 0)}
            icon={Clock3}
          />
        </div>
        <div className="glass-card p-4">
          <p className="text-soft mb-3 text-xs">Click a row for explainability, or open full monitoring.</p>
          <button
            type="button"
            onClick={() => router.push(monitoringHref({ status: "flagged" }))}
            className="mb-4 text-xs font-medium text-sky-700 underline dark:text-sky-400"
          >
            Open in transaction monitoring →
          </button>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-soft border-white/10 border-b">
                  <th align="left" className="pb-2">ID</th>
                  <th align="left" className="pb-2">User</th>
                  <th align="left" className="pb-2">Amount</th>
                  <th align="left" className="pb-2">Location</th>
                  <th align="left" className="pb-2">Risk</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
                    onClick={() => router.push(transactionDetailHref(tx.id))}
                  >
                    <td className="py-2 font-mono text-xs">#{tx.id}</td>
                    <td className="py-2">{tx.user_id}</td>
                    <td className="py-2">${tx.amount.toFixed(2)}</td>
                    <td className="py-2">{tx.location}</td>
                    <td className="py-2 font-semibold text-red-600 dark:text-red-400">
                      {tx.risk_score.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!transactions.length ? (
            <p className="text-soft mt-4 text-center text-sm">No flagged transactions right now.</p>
          ) : null}
        </div>
      </div>
      )}
    </AppShell>
    </RoleGuard>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="glass-card flex items-center gap-3 p-4">
      <span className="icon-chip">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-soft text-xs">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}
