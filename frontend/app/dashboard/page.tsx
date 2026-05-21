"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Percent,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleBanner } from "@/components/role-banner";
import { fraudQueueHref, transactionDetailHref } from "@/lib/transaction-links";
import { useHydrated } from "@/lib/use-hydrated";
import { useUserRole } from "@/lib/use-user-role";

import {
  ChartAreaSkeleton,
  KpiGridSkeleton,
  ListSkeleton,
  MetricPillsSkeleton,
  Skeleton,
  TableSkeleton,
} from "@/components/skeletons";
import { formatAuditAction, formatAuditDetails } from "@/lib/format-audit";

const FraudLineChart = dynamic(
  () => import("@/components/charts/fraud-line-chart").then((m) => m.FraudLineChart),
  { ssr: false, loading: () => <ChartAreaSkeleton /> }
);
const SimpleBarChart = dynamic(
  () => import("@/components/charts/bar-chart").then((m) => m.SimpleBarChart),
  { ssr: false, loading: () => <ChartAreaSkeleton className="min-h-[260px]" /> }
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
  const router = useRouter();
  const hydrated = useHydrated();
  const role = useUserRole();
  const isStaff = hydrated && (role === "analyst" || role === "admin");
  const queueHref = fraudQueueHref(role);
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    const load = async () => {
      setLoading(true);
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
      if (isStaff) {
        try {
          const a = await fetchWithAuth<AuditLog[]>("/dashboard/audit-logs", token);
          setAuditLogs(a.slice(0, 6));
        } catch {
          setAuditLogs([]);
        }
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
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [isStaff]);

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
          { title: "Suspicious transaction detected", detail: "Velocity threshold exceeded", time: "2 min ago" },
          { title: "User login from new device", detail: "New fingerprint + ASN", time: "8 min ago" },
        ];

  const subtitle =
    !hydrated || !role
      ? "Command center"
      : role === "user"
        ? "Your card activity"
        : role === "analyst"
          ? "Analyst command center"
          : "Command center";

  if (loading) {
    return (
      <AppShell title="Operations dashboard" subtitle={subtitle}>
        <div className="space-y-5">
          <RoleBanner />
          <Skeleton className="h-8 w-48 rounded-full" />
          <KpiGridSkeleton />
          <MetricPillsSkeleton />
          <ChartAreaSkeleton className="min-h-[300px]" />
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartAreaSkeleton className="min-h-[260px]" />
            <ChartAreaSkeleton className="min-h-[260px]" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <TableSkeleton rows={4} cols={4} />
            <ListSkeleton items={4} />
          </div>
          {isStaff ? <TableSkeleton rows={4} cols={3} /> : null}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Operations dashboard" subtitle={subtitle}>
      <div className="space-y-5">
        <RoleBanner />
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live · Fraud rate {(view.fraud_rate * 100).toFixed(2)}%
          </span>
          {modelMetrics ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
              <Activity className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              PR-AUC {String(modelMetrics.pr_auc)} · Recall {String(modelMetrics.recall_fraud)}
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <KpiCard
            icon={ArrowLeftRight}
            title="Total transactions"
            value={Number(view.total_transactions).toLocaleString()}
            subtitle="Monitored volume"
            tone="info"
          />
          <KpiCard
            icon={ShieldAlert}
            title="Fraud detected"
            value={Number(view.flagged_transactions).toLocaleString()}
            tone="danger"
            subtitle="View flagged transactions"
            href={queueHref}
          />
          <KpiCard
            icon={Percent}
            title="Fraud rate"
            value={`${(view.fraud_rate * 100).toFixed(2)}%`}
            tone="warning"
            subtitle="Of all events"
          />
          <KpiCard
            icon={ShieldCheck}
            title="Revenue protected"
            value={`$${Math.round(view.revenue_protected ?? 0).toLocaleString()}`}
            tone="success"
            subtitle="Estimated blocked exposure"
          />
          <KpiCard
            icon={Users}
            title="Active users"
            value={Number(view.active_users ?? 0).toLocaleString()}
            tone="violet"
            subtitle="Billable / tracked"
          />
          <KpiCard
            icon={Wallet}
            title="Transaction volume"
            value={`$${Math.round(view.total_volume).toLocaleString()}`}
            tone="default"
            subtitle="Rolling window"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricPill icon={Wallet} label="Volume (24h)" value={`$${Math.round(view.total_volume).toLocaleString()}`} tone="cyan" />
          <MetricPill
            icon={AlertTriangle}
            label="High-risk queue"
            value={String(view.flagged_transactions)}
            tone="red"
            href={queueHref}
          />
          <MetricPill icon={CheckCircle2} label="Auto-approved" value={String(view.approved_transactions)} tone="emerald" />
          <MetricPill icon={Clock} label="Decision latency" value="32 ms" tone="violet" />
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
          <div className="glass-card flex max-h-[min(22rem,40vh)] flex-col p-4">
            <PanelTitle icon={Radio} title="Live activity" />
            <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 text-sm">
              {liveView.map((item, idx) => (
                <li
                  key={`${item.title}-${idx}`}
                  className="flex gap-3 rounded-xl border border-slate-200/90 bg-white/50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-soft text-xs">{item.detail}</p>
                    <p className="text-soft mt-1 text-[10px] uppercase tracking-wide">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div id="alert-feed" className="glass-card flex max-h-[min(22rem,40vh)] scroll-mt-4 flex-col p-4">
            <PanelTitle icon={Bell} title="Alert feed" />
            <p className="text-soft -mt-2 mb-3 shrink-0 text-xs">Click a transaction to view details and explanation.</p>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
              {flaggedView.map((tx) => (
                <Link
                  key={tx.id}
                  href={transactionDetailHref(tx.id)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-red-200/60 bg-gradient-to-r from-red-50/80 to-white/60 px-3 py-2.5 transition hover:border-red-300 hover:shadow-md dark:border-red-500/20 dark:from-red-950/30 dark:to-slate-950/40 dark:hover:border-red-500/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-300">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        TX #{tx.id} · User {tx.user_id}
                      </p>
                      <p className="text-soft truncate text-xs">
                        ${tx.amount.toFixed(2)} · {tx.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-lg bg-red-500/15 px-2 py-1 text-sm font-bold text-red-600 dark:text-red-300">
                      {tx.risk_score.toFixed(1)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-red-400 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div id="recent-transactions" className="glass-card scroll-mt-4 p-4">
          <PanelTitle icon={ArrowLeftRight} title="Recent transactions" />
          <p className="text-soft -mt-2 mb-3 text-xs">Click a row to open transaction explainability.</p>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-soft border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-2 text-left">ID</th>
                  <th className="pb-2 text-left">Amount</th>
                  <th className="pb-2 text-left">Location</th>
                  <th className="pb-2 text-left">Status</th>
                  <th className="pb-2 text-left">Confidence</th>
                  <th className="pb-2 w-8" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {recentView.map((tx) => (
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
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/80 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-2 font-medium text-slate-900 dark:text-white">#{tx.id}</td>
                    <td className="py-2">${tx.amount.toFixed(2)}</td>
                    <td className="py-2">{tx.location}</td>
                    <td className="py-2 capitalize">{tx.status}</td>
                    <td className="py-2">{(tx.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2 text-slate-400">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card p-4">
            <PanelTitle icon={ShieldCheck} title="Rule & model health" />
            <div className="grid gap-2 text-sm">
              <HealthRow icon={CheckCircle2} label="Rule engine" value="Healthy" valueClass="text-emerald-600 dark:text-success" />
              <HealthRow
                icon={Activity}
                label="ML model"
                value={
                  modelMetrics?.pr_auc != null
                    ? `Active · PR-AUC ${String(modelMetrics.pr_auc)}`
                    : "Active"
                }
                valueClass="text-emerald-600 dark:text-success"
              />
              <HealthRow icon={ShieldAlert} label="Drift monitor" value="Low drift" valueClass="text-amber-600 dark:text-warning" />
              <HealthRow icon={Users} label="Analyst staffing" value="Within SLA" valueClass="text-emerald-600 dark:text-success" />
            </div>
          </div>
          {isStaff ? (
          <div className="glass-card p-4">
            <PanelTitle icon={Activity} title="Audit trail" />
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
                      <td className="py-2">{formatAuditAction(row.action)}</td>
                      <td className="py-2">
                        {row.entity} #{row.entity_id}
                      </td>
                      <td className="text-soft max-w-xs truncate py-2">{formatAuditDetails(row.details)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function PanelTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-sky-500/10 text-cyan-700 dark:text-cyan-300">
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
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
    <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white/40 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/30">
      <span className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10">
          <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" strokeWidth={2.25} />
        </span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
  tone = "cyan",
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "cyan" | "red" | "emerald" | "violet";
  href?: string;
}) {
  const tones = {
    cyan: {
      border: "border-cyan-200/70 dark:border-cyan-500/25",
      bg: "from-cyan-500/8 to-white/90 dark:from-cyan-400/10 dark:to-slate-900/90",
      icon: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",
    },
    red: {
      border: "border-red-200/70 dark:border-red-500/25",
      bg: "from-red-500/8 to-white/90 dark:from-red-400/10 dark:to-slate-900/90",
      icon: "bg-red-500/15 text-red-600 dark:text-red-300",
    },
    emerald: {
      border: "border-emerald-200/70 dark:border-emerald-500/25",
      bg: "from-emerald-500/8 to-white/90 dark:from-emerald-400/10 dark:to-slate-900/90",
      icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    },
    violet: {
      border: "border-violet-200/70 dark:border-violet-500/25",
      bg: "from-violet-500/8 to-white/90 dark:from-violet-400/10 dark:to-slate-900/90",
      icon: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    },
  };
  const t = tones[tone];

  const body = (
    <div
      className={`fintech-panel border bg-gradient-to-br px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-lg ${t.border} ${t.bg} ${href ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.icon}`}>
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <span className="text-soft text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 pl-[2.625rem] text-lg font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
    </div>
  );

  if (!href) return body;
  if (href.startsWith("#")) {
    return (
      <a href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50">
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50">
      {body}
    </Link>
  );
}
