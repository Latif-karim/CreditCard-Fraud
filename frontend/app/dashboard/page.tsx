"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, Users, Wallet } from "lucide-react";

import { AppShell } from "@/components/app-shell";

const FraudLineChart = dynamic(
  () => import("@/components/charts/fraud-line-chart").then((m) => m.FraudLineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const SimpleBarChart = dynamic(
  () => import("@/components/charts/bar-chart").then((m) => m.SimpleBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
import { KpiCard } from "@/components/kpi-card";
import { RiskHeatmap } from "@/components/risk-heatmap";
import { ScrollReveal } from "@/components/scroll-reveal";
import { fetchWithAuth } from "@/lib/api";
import type {
  AuditLog,
  DashboardOverview,
  FlaggedTransaction,
  HeatmapResponse,
  LabelValueResponse,
  LiveActivityItem,
  TrendResponse,
} from "@/lib/types";

type RecentTx = {
  id: number;
  amount: number;
  status: string;
  confidence: number;
  created_at: string;
  location: string;
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [trends, setTrends] = useState<TrendResponse | null>(null);
  const [flagged, setFlagged] = useState<FlaggedTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [region, setRegion] = useState<LabelValueResponse | null>(null);
  const [cardType, setCardType] = useState<LabelValueResponse | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [recent, setRecent] = useState<RecentTx[]>([]);
  const [live, setLive] = useState<LiveActivityItem[]>([]);
  const [modelMetrics, setModelMetrics] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    const load = async () => {
      try {
        setOverview(await fetchWithAuth<DashboardOverview>("/dashboard/overview", token));
      } catch {
        setOverview(null);
      }
      try {
        setTrends(await fetchWithAuth<TrendResponse>("/dashboard/trends", token));
      } catch {
        setTrends(null);
      }
      try {
        const f = await fetchWithAuth<FlaggedTransaction[]>("/transactions/flagged", token);
        setFlagged(f.slice(0, 6));
      } catch {
        setFlagged([]);
      }
      try {
        const a = await fetchWithAuth<AuditLog[]>("/dashboard/audit-logs", token);
        setAuditLogs(a.slice(0, 6));
      } catch {
        setAuditLogs([]);
      }
      try {
        setRegion(await fetchWithAuth<LabelValueResponse>("/dashboard/fraud-by-region", token));
      } catch {
        setRegion(null);
      }
      try {
        setCardType(await fetchWithAuth<LabelValueResponse>("/dashboard/fraud-by-card", token));
      } catch {
        setCardType(null);
      }
      try {
        setHeatmap(await fetchWithAuth<HeatmapResponse>("/dashboard/heatmap", token));
      } catch {
        setHeatmap(null);
      }
      try {
        setRecent(await fetchWithAuth<RecentTx[]>("/dashboard/recent-transactions", token));
      } catch {
        setRecent([]);
      }
      try {
        setLive(await fetchWithAuth<LiveActivityItem[]>("/dashboard/live-activity", token));
      } catch {
        setLive([]);
      }
      try {
        setModelMetrics(await fetchWithAuth<Record<string, unknown>>("/dashboard/model-metrics", token));
      } catch {
        setModelMetrics(null);
      }
    };
    void load();
  }, []);

  const view = overview ?? {
    total_transactions: 124302,
    flagged_transactions: 3912,
    approved_transactions: 120390,
    fraud_rate: 0.031,
    total_volume: 1293300,
    active_users: 8420,
    revenue_protected: 920000,
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
          {
            id: 1,
            actor_user_id: 1,
            action: "transaction_ingested",
            entity: "transaction",
            entity_id: "9021",
            details: "Flagged by rule+ml",
            created_at: "just now",
          },
          {
            id: 2,
            actor_user_id: 1,
            action: "alert_sent",
            entity: "alert",
            entity_id: "301",
            details: "Email dispatched",
            created_at: "3m ago",
          },
          {
            id: 3,
            actor_user_id: 2,
            action: "reviewed_transaction",
            entity: "transaction",
            entity_id: "8954",
            details: "Marked suspicious",
            created_at: "11m ago",
          },
        ];

  const regionView = region ?? { labels: ["UK", "US", "DE", "GH"], values: [120, 98, 76, 64] };
  const cardView = cardType ?? { labels: ["Visa", "Mastercard", "Amex"], values: [45, 32, 12] };
  const heatmapView = heatmap ?? {
    cells: [
      { country: "UK", category: "travel", intensity: 72 },
      { country: "US", category: "electronics", intensity: 58 },
      { country: "GH", category: "cash", intensity: 81 },
      { country: "DE", category: "groceries", intensity: 34 },
    ],
  };
  const recentView =
    recent.length > 0
      ? recent
      : [
          { id: 1, amount: 420, status: "flagged", confidence: 0.82, created_at: "", location: "London" },
          { id: 2, amount: 89, status: "approved", confidence: 0.12, created_at: "", location: "Berlin" },
        ];
  const liveView =
    live.length > 0
      ? live
      : [
          { title: "Suspicious transaction detected", detail: "Velocity threshold exceeded", time: "demo" },
          { title: "User login from new device", detail: "New fingerprint + ASN", time: "demo" },
        ];

  return (
    <AppShell title="Operations dashboard" subtitle="Command center">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Fraud rate {(view.fraud_rate * 100).toFixed(2)}%
          </span>
          {modelMetrics ? (
            <span className="text-soft text-xs">
              PR-AUC {String(modelMetrics.pr_auc)} · Recall {String(modelMetrics.recall_fraud)}
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <KpiCard title="Total transactions" value={String(view.total_transactions)} subtitle="Monitored volume" />
          <KpiCard title="Fraud detected" value={String(view.flagged_transactions)} tone="danger" subtitle="Open investigations" />
          <KpiCard title="Fraud %" value={`${(view.fraud_rate * 100).toFixed(2)}%`} subtitle="Of all events" />
          <KpiCard
            title="Revenue protected"
            value={`$${Math.round(view.revenue_protected ?? 0).toLocaleString()}`}
            subtitle="Estimated blocked exposure"
          />
          <KpiCard title="Active users" value={String(view.active_users ?? 0)} subtitle="Billable / tracked" />
          <KpiCard title="Transaction volume" value={`$${Math.round(view.total_volume).toLocaleString()}`} subtitle="Rolling window" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricPill icon={Wallet} label="Volume (24h)" value={`$${Math.round(view.total_volume).toLocaleString()}`} />
          <MetricPill icon={AlertTriangle} label="High-risk queue" value={String(view.flagged_transactions)} />
          <MetricPill icon={CheckCircle2} label="Auto-approved" value={String(view.approved_transactions)} />
          <MetricPill icon={Activity} label="Decision latency" value="32 ms" />
        </div>

        <ScrollReveal placeholderClassName="min-h-[300px]">
          <FraudLineChart labels={trendView.labels} fraudSeries={trendView.fraud_series} legitSeries={trendView.legit_series} />
        </ScrollReveal>

        <div className="grid gap-4 lg:grid-cols-2">
          <ScrollReveal placeholderClassName="min-h-[260px]">
            <SimpleBarChart title="Fraud by region" labels={regionView.labels} values={regionView.values} horizontal />
          </ScrollReveal>
          <ScrollReveal placeholderClassName="min-h-[260px]">
            <SimpleBarChart title="Fraud by card type" labels={cardView.labels} values={cardView.values} />
          </ScrollReveal>
        </div>

        <ScrollReveal placeholderClassName="min-h-[200px]">
          <RiskHeatmap cells={heatmapView.cells} />
        </ScrollReveal>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card p-4">
            <h3 className="mb-3 text-base font-semibold">Live activity</h3>
            <ul className="space-y-3 text-sm">
              {liveView.map((item, idx) => (
                <li
                  key={`${item.title}-${idx}`}
                  className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-soft text-xs">{item.detail}</p>
                  <p className="text-soft mt-1 text-[10px] uppercase">{item.time}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-4">
            <h3 className="mb-3 text-base font-semibold">Alert feed</h3>
            <div className="space-y-2">
              {flaggedView.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      TX #{tx.id} · User {tx.user_id}
                    </p>
                    <p className="text-soft text-xs">
                      ${tx.amount.toFixed(2)} · {tx.location}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-red-600 dark:text-danger">{tx.risk_score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="mb-3 text-base font-semibold">Recent transactions</h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-soft border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-2 text-left">ID</th>
                  <th className="pb-2 text-left">Amount</th>
                  <th className="pb-2 text-left">Location</th>
                  <th className="pb-2 text-left">Status</th>
                  <th className="pb-2 text-left">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recentView.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="py-2">{tx.id}</td>
                    <td className="py-2">${tx.amount.toFixed(2)}</td>
                    <td className="py-2">{tx.location}</td>
                    <td className="py-2 capitalize">{tx.status}</td>
                    <td className="py-2">{(tx.confidence * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card p-4">
            <h3 className="mb-3 text-base font-semibold">Rule & model health</h3>
            <div className="grid gap-2 text-sm">
              <HealthRow icon={CheckCircle2} label="Rule engine" value="Healthy" valueClass="text-emerald-600 dark:text-success" />
              <HealthRow icon={Activity} label="ML bundle" value="fraud_model.joblib" />
              <HealthRow icon={ShieldAlert} label="Drift monitor" value="Low drift" valueClass="text-amber-600 dark:text-warning" />
              <HealthRow icon={Users} label="Analyst staffing" value="Within SLA" valueClass="text-emerald-600 dark:text-success" />
            </div>
          </div>
          <div className="glass-card p-4">
            <h3 className="mb-3 text-base font-semibold">Audit trail</h3>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="text-soft border-b border-slate-200 dark:border-slate-800">
                    <th className="pb-2 text-left">Action</th>
                    <th className="pb-2 text-left">Entity</th>
                    <th className="pb-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logsView.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="py-2">{row.action}</td>
                      <td className="py-2">
                        {row.entity} #{row.entity_id}
                      </td>
                      <td className="text-soft max-w-xs truncate py-2">{row.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
  valueClass = "text-slate-700 dark:text-slate-200",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="glass-card min-h-[220px] animate-pulse bg-slate-100/50 dark:bg-slate-800/30" />;
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
    <div className="fintech-panel px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
        <span className="text-soft text-xs">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
