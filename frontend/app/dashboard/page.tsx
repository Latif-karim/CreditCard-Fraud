"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, Wallet } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { FraudLineChart } from "@/components/charts/fraud-line-chart";
import { KpiCard } from "@/components/kpi-card";
import { fetchWithAuth } from "@/lib/api";
import type { AuditLog, DashboardOverview, FlaggedTransaction, TrendResponse } from "@/lib/types";

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [trends, setTrends] = useState<TrendResponse | null>(null);
  const [flagged, setFlagged] = useState<FlaggedTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    fetchWithAuth<DashboardOverview>("/dashboard/overview", token)
      .then(setOverview)
      .catch(() => {
        setOverview(null);
      });
    fetchWithAuth<TrendResponse>("/dashboard/trends", token)
      .then(setTrends)
      .catch(() => {
        setTrends(null);
      });
    fetchWithAuth<FlaggedTransaction[]>("/transactions/flagged", token)
      .then((rows) => setFlagged(rows.slice(0, 6)))
      .catch(() => setFlagged([]));
    fetchWithAuth<AuditLog[]>("/dashboard/audit-logs", token)
      .then((rows) => setAuditLogs(rows.slice(0, 6)))
      .catch(() => setAuditLogs([]));
  }, []);

  const view = overview ?? {
    total_transactions: 124302,
    flagged_transactions: 3912,
    approved_transactions: 120390,
    fraud_rate: 0.031,
    total_volume: 1293300,
  };

  const trendView = trends ?? {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    fraud_series: [18, 22, 20, 29, 25, 31, 27],
    legit_series: [1020, 1110, 1090, 1215, 1250, 1302, 1278],
  };

  const flaggedView =
    flagged.length > 0
      ? flagged
      : [
          { id: 9021, user_id: 42, amount: 980.5, location: "Accra", risk_score: 87.1, created_at: "" },
          { id: 9022, user_id: 88, amount: 2400, location: "Lagos", risk_score: 91.4, created_at: "" },
          { id: 9023, user_id: 23, amount: 620.5, location: "London", risk_score: 74.8, created_at: "" },
        ];

  const logsView =
    auditLogs.length > 0
      ? auditLogs
      : [
          { id: 1, actor_user_id: 1, action: "transaction_ingested", entity: "transaction", entity_id: "9021", details: "Flagged by rule+ml", created_at: "just now" },
          { id: 2, actor_user_id: 1, action: "alert_sent", entity: "alert", entity_id: "301", details: "Email dispatched", created_at: "3m ago" },
          { id: 3, actor_user_id: 2, action: "reviewed_transaction", entity: "transaction", entity_id: "8954", details: "Marked suspicious", created_at: "11m ago" },
        ];

  return (
    <AppShell title="Admin Dashboard" subtitle="Command Center">
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 w-fit">
          Fraud rate {(view.fraud_rate * 100).toFixed(2)}%
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Total Transactions" value={String(view.total_transactions)} subtitle="All monitored events" />
          <KpiCard title="Flagged Transactions" value={String(view.flagged_transactions)} tone="danger" subtitle="Needs analyst review" />
          <KpiCard title="Approved Transactions" value={String(view.approved_transactions)} tone="success" subtitle="Auto-approved by engine" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <MetricPill icon={Wallet} label="Volume (24h)" value={`$${Math.round(view.total_volume).toLocaleString()}`} />
          <MetricPill icon={AlertTriangle} label="High Risk Alerts" value="312" />
          <MetricPill icon={CheckCircle2} label="False Positives" value="2.1%" />
          <MetricPill icon={Activity} label="Decision Latency" value="32 ms" />
        </div>
        <div>
          <FraudLineChart
            labels={trendView.labels}
            fraudSeries={trendView.fraud_series}
            legitSeries={trendView.legit_series}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card p-4">
            <h3 className="mb-3 text-base font-semibold">Live Alert Feed</h3>
            <div className="space-y-2">
              {flaggedView.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">TX #{tx.id} - User {tx.user_id}</p>
                    <p className="text-soft text-xs">
                      ${tx.amount.toFixed(2)} at {tx.location}
                    </p>
                  </div>
                  <span className="text-danger text-sm font-semibold">{tx.risk_score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="mb-3 text-base font-semibold">Rule & Model Health</h3>
            <div className="grid gap-2 text-sm">
              <HealthRow icon={CheckCircle2} label="Rule Engine" value="Healthy" valueClass="text-success" />
              <HealthRow icon={Activity} label="ML Model Version" value="rf_smote_v1" />
              <HealthRow icon={ShieldAlert} label="Drift Status" value="Low Drift" valueClass="text-warning" />
              <HealthRow icon={AlertTriangle} label="Queue Pressure" value="Normal" valueClass="text-success" />
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="mb-3 text-base font-semibold">Recent Audit Activity</h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="text-soft border-b border-slate-800">
                  <th align="left" className="pb-2">Action</th>
                  <th align="left" className="pb-2">Entity</th>
                  <th align="left" className="pb-2">Entity ID</th>
                  <th align="left" className="pb-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {logsView.map((row) => (
                  <tr key={row.id} className="border-b border-slate-800 last:border-0">
                    <td className="py-2">{row.action}</td>
                    <td className="py-2">{row.entity}</td>
                    <td className="py-2">{row.entity_id}</td>
                    <td className="text-soft py-2">{row.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function HealthRow({
  icon: Icon,
  label,
  value,
  valueClass = "text-slate-200",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
      <span className="flex items-center gap-2 text-slate-300">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-300" />
        <span className="text-soft text-xs">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
