"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
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
import { notificationHref } from "@/lib/notification-links";
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
import { fetchWithAuth, peekApiCache, postWithAuth } from "@/lib/api";
import {
  applyCreatedToOverview,
  toFlaggedTransaction,
  toLiveActivityItem,
  toRecentTx,
  type LiveStreamEvent,
} from "@/lib/live-updates";
import { useLiveEvent } from "@/lib/use-live-event";
import type {
  AuditLog,
  DashboardOverview,
  FlaggedTransaction,
  HeatmapResponse,
  LabelValueResponse,
  LiveActivityItem,
  TrendResponse,
  FraudNotification,
} from "@/lib/types";

type RecentTx = {
  id: number;
  amount: number;
  status: string;
  confidence: number;
  created_at: string;
  location: string;
  merchant?: string | null;
  customer_status?: string;
};

function dashboardHasCache(token: string): boolean {
  return peekApiCache("/dashboard/overview", token) !== null;
}

function formatMetric(value: unknown): string {
  if (value == null) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  if (n >= 0 && n <= 1) return n.toFixed(3);
  return n.toFixed(2);
}

function formatPercent(rate: number | undefined | null): string {
  if (rate == null || Number.isNaN(rate)) return "0.00%";
  return `${(rate * 100).toFixed(2)}%`;
}

const EMPTY_OVERVIEW: DashboardOverview = {
  total_transactions: 0,
  flagged_transactions: 0,
  disputed_transactions: 0,
  approved_transactions: 0,
  under_review_transactions: 0,
  fraud_rate: 0,
  review_rate: 0,
  total_volume: 0,
  flagged_volume: 0,
  active_users: 0,
  revenue_protected: 0,
};

function EmptyPanel({ message }: { message: string }) {
  return (
    <p className="text-soft rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm dark:border-slate-800">
      {message}
    </p>
  );
}

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
  const [notifications, setNotifications] = useState<FraudNotification[]>([]);
  const [modelMetrics, setModelMetrics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputeBusy, setDisputeBusy] = useState<number | null>(null);
  const [disputeNotice, setDisputeNotice] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!hydrated || !role) return;
    const token = localStorage.getItem("access_token") || "";
    setDisputeNotice("");

    if (role === "user") {
      const [overviewRes, recentRes, liveRes, notifsRes] = await Promise.all([
        fetchWithAuth<DashboardOverview>("/dashboard/overview", token).catch(() => null),
        fetchWithAuth<RecentTx[]>("/dashboard/recent-transactions", token).catch(() => []),
        fetchWithAuth<LiveActivityItem[]>("/dashboard/live-activity", token).catch(() => []),
        fetchWithAuth<FraudNotification[]>("/alerts/notifications", token).catch(() => []),
      ]);
      setOverview(overviewRes);
      setRecent(recentRes ?? []);
      setLive(liveRes ?? []);
      setNotifications(notifsRes ?? []);
      setFlagged([]);
      setAuditLogs([]);
      setRegion(null);
      setCardType(null);
      setHeatmap(null);
      setModelMetrics(null);
      setLoading(false);
      return;
    }

    const [
      overviewRes,
      trendsRes,
      flaggedRes,
      auditRes,
      regionRes,
      cardRes,
      heatmapRes,
      recentRes,
      liveRes,
      metricsRes,
    ] = await Promise.all([
      fetchWithAuth<DashboardOverview>("/dashboard/overview", token).catch(() => null),
      fetchWithAuth<TrendResponse>("/dashboard/trends", token).catch(() => null),
      fetchWithAuth<FlaggedTransaction[]>("/transactions/flagged", token).catch(() => []),
      isStaff
        ? fetchWithAuth<AuditLog[]>("/dashboard/audit-logs", token).catch(() => [])
        : Promise.resolve([] as AuditLog[]),
      fetchWithAuth<LabelValueResponse>("/dashboard/fraud-by-region", token).catch(() => null),
      fetchWithAuth<LabelValueResponse>("/dashboard/fraud-by-card", token).catch(() => null),
      fetchWithAuth<HeatmapResponse>("/dashboard/heatmap", token).catch(() => null),
      fetchWithAuth<RecentTx[]>("/dashboard/recent-transactions", token).catch(() => []),
      fetchWithAuth<LiveActivityItem[]>("/dashboard/live-activity", token).catch(() => []),
      fetchWithAuth<Record<string, unknown>>("/dashboard/model-metrics", token).catch(() => null),
    ]);

    setOverview(overviewRes);
    setTrends(trendsRes);
    setFlagged((flaggedRes ?? []).slice(0, 6));
    setAuditLogs((auditRes ?? []).slice(0, 6));
    setRegion(regionRes);
    setCardType(cardRes);
    setHeatmap(heatmapRes);
    setRecent(recentRes ?? []);
    setLive(liveRes ?? []);
    setModelMetrics(metricsRes);
    setLoading(false);
  }, [hydrated, isStaff, role]);

  useEffect(() => {
    if (!hydrated || !role) return;
    const token = localStorage.getItem("access_token") || "";
    const hasCache = dashboardHasCache(token);
    if (hasCache) {
      setOverview(peekApiCache<DashboardOverview>("/dashboard/overview", token));
      setTrends(peekApiCache<TrendResponse>("/dashboard/trends", token));
      setFlagged(peekApiCache<FlaggedTransaction[]>("/transactions/flagged", token) ?? []);
      setAuditLogs(peekApiCache<AuditLog[]>("/dashboard/audit-logs", token)?.slice(0, 6) ?? []);
      setRegion(peekApiCache<LabelValueResponse>("/dashboard/fraud-by-region", token));
      setCardType(peekApiCache<LabelValueResponse>("/dashboard/fraud-by-card", token));
      setHeatmap(peekApiCache<HeatmapResponse>("/dashboard/heatmap", token));
      setRecent(peekApiCache<RecentTx[]>("/dashboard/recent-transactions", token) ?? []);
      setLive(peekApiCache<LiveActivityItem[]>("/dashboard/live-activity", token) ?? []);
      setNotifications(peekApiCache<FraudNotification[]>("/alerts/notifications", token) ?? []);
      setModelMetrics(peekApiCache<Record<string, unknown>>("/dashboard/model-metrics", token));
      setLoading(false);
    } else {
      setLoading(true);
    }
    void loadDashboard();
  }, [hydrated, role, loadDashboard]);

  useLiveEvent(
    useCallback(
      (event: LiveStreamEvent) => {
        if (event.type === "transaction.created") {
          const tx = event.transaction;
          setOverview((prev) => applyCreatedToOverview(prev ?? EMPTY_OVERVIEW, tx));
          setRecent((prev) => {
            if (prev.some((r) => r.id === tx.id)) return prev;
            return [toRecentTx(tx), ...prev].slice(0, 12);
          });
          setLive((prev) => [toLiveActivityItem(tx), ...prev].slice(0, 8));
          if (event.notification) {
            setNotifications((prev) => {
              if (prev.some((n) => n.id === event.notification!.id)) return prev;
              return [event.notification!, ...prev].slice(0, 20);
            });
          }
          if (isStaff && tx.status === "flagged") {
            setFlagged((prev) => {
              if (prev.some((f) => f.id === tx.id)) return prev;
              return [toFlaggedTransaction(tx), ...prev].slice(0, 6);
            });
          }
          return;
        }
        if (event.type === "transaction.updated") {
          const tx = event.transaction;
          setRecent((prev) => prev.map((r) => (r.id === tx.id ? { ...r, ...toRecentTx(tx) } : r)));
          if (isStaff) {
            setFlagged((prev) => {
              if (tx.status === "flagged") {
                if (prev.some((f) => f.id === tx.id)) {
                  return prev.map((f) => (f.id === tx.id ? toFlaggedTransaction(tx) : f));
                }
                return [toFlaggedTransaction(tx), ...prev].slice(0, 6);
              }
              return prev.filter((f) => f.id !== tx.id);
            });
          }
        }
      },
      [isStaff]
    ),
    hydrated && !!role
  );

  const view = overview ?? EMPTY_OVERVIEW;
  const customerView = overview ?? EMPTY_OVERVIEW;
  const underReviewCount =
    customerView.under_review_transactions ?? customerView.flagged_transactions ?? 0;

  const hasTrendData = Boolean(trends?.labels?.length);
  const hasRegionData = Boolean(region?.labels?.length);
  const hasCardData = Boolean(cardType?.labels?.length);
  const hasHeatmapData = Boolean(heatmap?.cells?.length);

  const enabledRules = view.enabled_rules ?? 0;
  const totalRules = view.total_rules ?? 0;
  const activeAnalysts = view.active_analysts ?? 0;
  const ruleEngineValue =
    totalRules === 0
      ? "No rules configured"
      : enabledRules === totalRules
        ? `${enabledRules} rules active`
        : `${enabledRules}/${totalRules} rules active`;
  const ruleEngineClass =
    totalRules > 0 && enabledRules > 0
      ? "text-emerald-600 dark:text-success"
      : "text-amber-600 dark:text-warning";
  const driftValue = modelMetrics?.last_trained
    ? `Last trained ${String(modelMetrics.last_trained)}`
    : "Offline evaluation only";
  const staffingValue =
    view.flagged_transactions === 0
      ? `${activeAnalysts} staff · queue clear`
      : `${activeAnalysts} staff · ${view.flagged_transactions} flagged`;

  const submitDispute = async (txId: number, reason: "not_mine" | "request_review") => {
    const token = localStorage.getItem("access_token") || "";
    setDisputeBusy(txId);
    setDisputeNotice("");
    try {
      const res = await postWithAuth<{ message: string; transaction_status: string }>(
        `/transactions/${txId}/dispute`,
        { reason },
        token
      );
      setRecent((prev) =>
        prev.map((tx) =>
          tx.id === txId ? { ...tx, status: res.transaction_status, customer_status: "Under Review" } : tx
        )
      );
      setDisputeNotice(res.message);
    } catch (err) {
      setDisputeNotice((err as Error).message);
    } finally {
      setDisputeBusy(null);
    }
  };

  const subtitle =
    !hydrated || !role
      ? "Command center"
      : role === "user"
        ? "Your card activity"
        : role === "analyst"
          ? "Analyst command center"
          : "Command center";

  if (!hydrated || loading) {
    return (
      <AppShell title={role === "user" ? "Cardholder dashboard" : "Operations dashboard"} subtitle={subtitle}>
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

  if (role === "user") {
    return (
      <AppShell title="Cardholder dashboard" subtitle="Your card activity and alerts">
        <div className="space-y-5">
          <RoleBanner />
          {disputeNotice ? (
            <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
              {disputeNotice}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={CreditCard}
              title="Your transactions"
              value={Number(customerView.total_transactions).toLocaleString()}
              subtitle="Only your account"
              tone="info"
            />
            <KpiCard
              icon={ShieldAlert}
              title="Under review"
              value={Number(underReviewCount).toLocaleString()}
              subtitle={`${formatPercent(customerView.review_rate ?? 0)} of your activity`}
              tone="warning"
            />
            <KpiCard
              icon={CheckCircle2}
              title="Safe"
              value={Number(customerView.approved_transactions).toLocaleString()}
              subtitle="Approved activity"
              tone="success"
            />
            <KpiCard
              icon={Wallet}
              title="Total spent"
              value={`$${Math.round(customerView.total_volume).toLocaleString()}`}
              subtitle="Personal history"
              tone="default"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass-card p-4" id="alert-feed">
              <PanelTitle icon={Bell} title="Fraud alerts" />
              <div className="space-y-3">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={notificationHref(n, role)}
                    className="block rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm transition hover:border-amber-300 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 dark:hover:border-amber-800"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                    <p className="text-soft mt-1 text-xs">{n.body}</p>
                    <p className="text-soft mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wide">
                      {new Date(n.created_at).toLocaleString()}
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </p>
                  </Link>
                ))}
                {!notifications.length ? (
                  <p className="text-soft rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                    No account alerts right now.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="glass-card p-4">
              <PanelTitle icon={Radio} title="Account activity" />
              <ul className="space-y-3 text-sm">
                {live.map((item, idx) => (
                  <li key={`${item.title}-${idx}`} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                    <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-soft text-xs">{item.detail}</p>
                    <p className="text-soft mt-1 text-[10px] uppercase tracking-wide">{item.time}</p>
                  </li>
                ))}
                {!live.length ? <p className="text-soft text-sm">No recent activity.</p> : null}
              </ul>
            </div>
          </div>

          <div className="glass-card scroll-mt-4 p-4">
            <PanelTitle icon={ArrowLeftRight} title="Personal transactions" />
            <p className="text-soft -mt-2 mb-3 text-xs">
              Customer view shows simplified risk status only. Use Report or Not mine to request analyst review.
            </p>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="text-soft border-b border-slate-200 dark:border-slate-800">
                    <th className="pb-2 text-left">Date</th>
                    <th className="pb-2 text-left">Merchant</th>
                    <th className="pb-2 text-left">Amount</th>
                    <th className="pb-2 text-left">Location</th>
                    <th className="pb-2 text-left">Status</th>
                    <th className="pb-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="py-2">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}</td>
                      <td className="py-2">{tx.merchant || "Merchant"}</td>
                      <td className="py-2">${tx.amount.toFixed(2)}</td>
                      <td className="py-2">{tx.location}</td>
                      <td className="py-2">
                        <CustomerStatusBadge status={tx.customer_status || tx.status} />
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={disputeBusy !== null}
                            onClick={() => void submitDispute(tx.id, "request_review")}
                            className="rounded border border-sky-200 px-2 py-1 text-xs font-medium text-sky-700 disabled:opacity-40 dark:border-sky-900 dark:text-sky-300"
                          >
                            Request review
                          </button>
                          <button
                            type="button"
                            disabled={disputeBusy !== null}
                            onClick={() => void submitDispute(tx.id, "not_mine")}
                            className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-40 dark:border-red-900 dark:text-red-400"
                          >
                            {disputeBusy === tx.id ? "…" : "Not mine"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!recent.length ? (
                <p className="text-soft py-4 text-sm">No transactions have been recorded for your account.</p>
              ) : null}
            </div>
          </div>
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
            Live · Flagged rate {formatPercent(view.fraud_rate)}
            {view.total_transactions > 0 ? ` · ${view.total_transactions.toLocaleString()} captured` : ""}
          </span>
          {modelMetrics ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
              <Activity className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              PR-AUC {formatMetric(modelMetrics.pr_auc)} · Recall {formatMetric(modelMetrics.recall_fraud)}
              {modelMetrics.artifact_present === false ? " · bootstrap needed" : ""}
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
            title="Flagged rate"
            value={formatPercent(view.fraud_rate)}
            tone="warning"
            subtitle={`${view.flagged_transactions} of ${view.total_transactions} captured`}
          />
          <KpiCard
            icon={ShieldCheck}
            title="Flagged volume"
            value={`$${Math.round(view.flagged_volume ?? view.revenue_protected ?? 0).toLocaleString()}`}
            tone="success"
            subtitle="Sum of suspicious amounts"
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
          <MetricPill icon={Clock} label="Under review" value={String(view.under_review_transactions ?? 0)} tone="violet" />
        </div>

        <ScrollReveal placeholderClassName="min-h-[300px]">
          {hasTrendData && trends ? (
            <FraudLineChart labels={trends.labels} fraudSeries={trends.fraud_series} legitSeries={trends.legit_series} />
          ) : (
            <EmptyPanel message="No trend data yet. Capture transactions to populate this chart." />
          )}
        </ScrollReveal>

        <div className="grid gap-4 lg:grid-cols-2">
          <ScrollReveal placeholderClassName="min-h-[260px]">
            {hasRegionData && region ? (
              <SimpleBarChart title="Fraud by region" labels={region.labels} values={region.values} horizontal />
            ) : (
              <EmptyPanel message="No regional fraud breakdown yet." />
            )}
          </ScrollReveal>
          <ScrollReveal placeholderClassName="min-h-[260px]">
            {hasCardData && cardType ? (
              <SimpleBarChart title="Fraud by card type" labels={cardType.labels} values={cardType.values} />
            ) : (
              <EmptyPanel message="No card-type fraud breakdown yet." />
            )}
          </ScrollReveal>
        </div>

        <ScrollReveal placeholderClassName="min-h-[200px]">
          {hasHeatmapData && heatmap ? (
            <RiskHeatmap cells={heatmap.cells} />
          ) : (
            <EmptyPanel message="No risk concentration data yet." />
          )}
        </ScrollReveal>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card flex max-h-[min(22rem,40vh)] flex-col p-4">
            <PanelTitle icon={Radio} title="Live activity" />
            <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 text-sm">
              {live.map((item, idx) => (
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
              {!live.length ? <EmptyPanel message="No audit or account activity recorded yet." /> : null}
            </ul>
          </div>
          <div id="alert-feed" className="glass-card flex max-h-[min(22rem,40vh)] scroll-mt-4 flex-col p-4">
            <PanelTitle icon={Bell} title="Alert feed" />
            <p className="text-soft -mt-2 mb-3 shrink-0 text-xs">Click a transaction to view details and explanation.</p>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
              {flagged.map((tx) => (
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
              {!flagged.length ? <EmptyPanel message="No flagged transactions in the queue." /> : null}
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
                {recent.map((tx) => (
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
            {!recent.length ? <EmptyPanel message="No transactions captured yet." /> : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card p-4">
            <PanelTitle icon={ShieldCheck} title="Rule & model health" />
            <div className="grid gap-2 text-sm">
              <HealthRow icon={CheckCircle2} label="Rule engine" value={ruleEngineValue} valueClass={ruleEngineClass} />
              <HealthRow
                icon={Activity}
                label="ML model"
                value={
                  modelMetrics?.pr_auc != null
                    ? `Active · PR-AUC ${formatMetric(modelMetrics.pr_auc)}`
                    : modelMetrics?.artifact_present === false
                      ? "Fallback heuristic (train model)"
                      : "Active"
                }
                valueClass="text-emerald-600 dark:text-success"
              />
              <HealthRow icon={ShieldAlert} label="Model drift" value={driftValue} valueClass="text-amber-600 dark:text-warning" />
              <HealthRow icon={Users} label="Analyst queue" value={staffingValue} valueClass="text-emerald-600 dark:text-success" />
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
                  {auditLogs.map((row) => (
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
            {!auditLogs.length ? <EmptyPanel message="No audit events recorded yet." /> : null}
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

function CustomerStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label =
    normalized === "flagged" || normalized === "disputed" || normalized === "under review"
      ? "Under Review"
      : normalized === "declined" || normalized === "blocked"
        ? "Blocked"
        : "Safe";
  const cls =
    label === "Blocked"
      ? "bg-red-500/15 text-red-700 dark:text-red-300"
      : label === "Under Review"
        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
        : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
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
