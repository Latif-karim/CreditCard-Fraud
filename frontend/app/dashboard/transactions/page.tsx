"use client";

import { useEffect, useState } from "react";
import { Clock3, Search, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { fetchWithAuth } from "@/lib/api";
import type { FlaggedTransaction } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    fetchWithAuth<FlaggedTransaction[]>("/transactions/flagged", token)
      .then(setTransactions)
      .catch(() => {
        setTransactions([]);
      });
  }, []);

  const txView =
    transactions.length > 0
      ? transactions
      : [
          { id: 9001, user_id: 302, amount: 1340.2, location: "London", risk_score: 88.1, created_at: "" },
          { id: 9002, user_id: 118, amount: 925.5, location: "Berlin", risk_score: 76.4, created_at: "" },
          { id: 9003, user_id: 874, amount: 4900, location: "Accra", risk_score: 82.9, created_at: "" },
          { id: 9004, user_id: 201, amount: 210.6, location: "Nairobi", risk_score: 67.5, created_at: "" },
        ];

  return (
    <AppShell title="Flagged Transactions" subtitle="Investigation Queue">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoTile label="Open Cases" value="38" icon={ShieldAlert} />
          <InfoTile label="Avg Review Time" value="14 min" icon={Clock3} />
          <InfoTile label="Escalation Rate" value="7.2%" icon={Clock3} />
        </div>
        <div className="glass-card p-4">
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-400">
            <Search className="h-4 w-4" />
            Search by transaction ID, user, location (UI placeholder)
          </div>
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
                {txView.map((tx) => (
                  <tr key={tx.id} className="border-white/10 border-b last:border-0">
                    <td className="py-2">{tx.id}</td>
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
            <p className="text-soft mt-3 text-xs">Showing placeholder records until backend returns flagged data.</p>
          ) : null}
        </div>
      </div>
    </AppShell>
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
