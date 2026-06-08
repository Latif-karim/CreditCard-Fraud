import type { DashboardOverview, FraudNotification, TransactionRow } from "@/lib/types";

export type LiveStreamEvent =
  | {
      type: "transaction.created";
      transaction: TransactionRow;
      notification?: FraudNotification | null;
    }
  | {
      type: "transaction.updated";
      transaction: TransactionRow;
    };

export const LIVE_STREAM_EVENT = "fraudshield:live";

export function dispatchLiveEvent(event: LiveStreamEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<LiveStreamEvent>(LIVE_STREAM_EVENT, { detail: event }));
}

export function applyCreatedToOverview(
  overview: DashboardOverview,
  tx: TransactionRow
): DashboardOverview {
  const total = (overview.total_transactions ?? 0) + 1;
  const flagged = tx.status === "flagged";
  const disputed = tx.status === "disputed";
  const flaggedCount = (overview.flagged_transactions ?? 0) + (flagged ? 1 : 0);
  const approvedCount = (overview.approved_transactions ?? 0) + (!flagged && !disputed ? 1 : 0);
  const disputedCount = (overview.disputed_transactions ?? 0) + (disputed ? 1 : 0);
  const totalVolume = (overview.total_volume ?? 0) + tx.amount;
  const flaggedVolume =
    (overview.flagged_volume ?? 0) + (flagged ? tx.amount : 0);

  return {
    ...overview,
    total_transactions: total,
    flagged_transactions: flaggedCount,
    approved_transactions: approvedCount,
    disputed_transactions: disputedCount,
    under_review_transactions: flaggedCount + disputedCount,
    total_volume: totalVolume,
    flagged_volume: flaggedVolume,
    fraud_rate: total > 0 ? flaggedCount / total : 0,
    review_rate: total > 0 ? (flaggedCount + disputedCount) / total : 0,
  };
}

export type MonitoringFilters = {
  q: string;
  status: string;
  riskMin: string;
  country: string;
};

export function transactionMatchesMonitoringFilters(
  tx: TransactionRow,
  filters: MonitoringFilters
): boolean {
  if (filters.status && tx.status !== filters.status) return false;
  if (filters.riskMin) {
    const min = parseFloat(filters.riskMin);
    if (!Number.isNaN(min) && tx.risk_score < min) return false;
  }
  if (filters.country) {
    const needle = filters.country.toLowerCase();
    const hay = `${tx.country ?? ""} ${tx.location ?? ""}`.toLowerCase();
    if (!hay.includes(needle)) return false;
  }
  if (filters.q.trim()) {
    const q = filters.q.trim().toLowerCase();
    const blob = [
      String(tx.id),
      tx.merchant ?? "",
      tx.location ?? "",
      tx.card_last4 ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!blob.includes(q) && !(q.match(/^\d+$/) && String(tx.id) === q)) return false;
  }
  return true;
}

export function toFlaggedTransaction(tx: TransactionRow) {
  return {
    id: tx.id,
    user_id: tx.user_id,
    amount: tx.amount,
    location: tx.location,
    risk_score: tx.risk_score,
    created_at: tx.created_at,
  };
}

export function toRecentTx(tx: TransactionRow) {
  return {
    id: tx.id,
    amount: tx.amount,
    status: tx.status,
    confidence: tx.confidence,
    created_at: tx.created_at,
    location: tx.location,
    merchant: tx.merchant,
    customer_status: tx.customer_status,
  };
}

export function toLiveActivityItem(tx: TransactionRow) {
  const flagged = tx.status === "flagged";
  return {
    title: flagged ? `Flagged TX #${tx.id}` : `Transaction #${tx.id}`,
    detail: `$${tx.amount.toFixed(2)} · ${tx.merchant || tx.location}`,
    time: tx.created_at,
  };
}
