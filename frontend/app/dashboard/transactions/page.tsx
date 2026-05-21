"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock3, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { CardGridSkeleton, TableSkeleton } from "@/components/skeletons";
import { fetchWithAuth } from "@/lib/api";
import { monitoringHref, transactionDetailHref } from "@/lib/transaction-links";
import type { FlaggedTransaction } from "@/lib/types";

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    setLoading(true);
    fetchWithAuth<FlaggedTransaction[]>("/transactions/flagged", token)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

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
          <InfoTile label="Open Cases" value="38" icon={ShieldAlert} />
          <InfoTile label="Avg Review Time" value="14 min" icon={Clock3} />
          <InfoTile label="Escalation Rate" value="7.2%" icon={Clock3} />
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
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(transactionDetailHref(tx.id))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(transactionDetailHref(tx.id));
                      }
                    }}
                    className="cursor-pointer border-white/10 border-b transition hover:bg-slate-50/80 last:border-0 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-2 font-medium">#{tx.id}</td>
                    <td className="py-2">{tx.user_id}</td>
                    <td className="py-2">${tx.amount.toFixed(2)}</td>
                    <td className="py-2">{tx.location}</td>
                    <td className={`py-2 ${tx.risk_score >= 80 ? "text-danger" : "text-warning"}`}>
                      {tx.risk_score.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!transactions.length ? (
            <p className="text-soft mt-3 text-sm">No flagged transactions in the queue.</p>
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
  icon: typeof ShieldAlert;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-slate-300">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
