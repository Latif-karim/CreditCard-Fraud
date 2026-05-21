import type { AppRole } from "@/lib/roles";

/** Open AI explainability for a specific transaction (all roles). */
export function transactionDetailHref(txId: number): string {
  return `/dashboard/explain?tx=${txId}`;
}

/** List view filtered for high-risk / flagged work (staff). */
export function flaggedListHref(): string {
  return "/dashboard/transactions";
}

/** Monitoring table with optional filters (staff). */
export function monitoringHref(params?: { status?: string; tx?: number; q?: string }): string {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.tx != null) search.set("tx", String(params.tx));
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  return qs ? `/dashboard/monitoring?${qs}` : "/dashboard/monitoring";
}

/** Where a dashboard KPI / metric about fraud volume should link. */
export function fraudQueueHref(role: AppRole | null): string {
  if (role === "analyst" || role === "admin") {
    return monitoringHref({ status: "flagged" });
  }
  return "#alert-feed";
}
