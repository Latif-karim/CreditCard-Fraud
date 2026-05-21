"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Filter, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { TableSkeleton } from "@/components/skeletons";
import { fetchWithAuth, patchWithAuth } from "@/lib/api";
import { transactionDetailHref } from "@/lib/transaction-links";
import type { PaginatedTransactions, TransactionRow } from "@/lib/types";

export default function MonitoringPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightTx = searchParams.get("tx");
  const [data, setData] = useState<PaginatedTransactions | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [riskMin, setRiskMin] = useState("");
  const [country, setCountry] = useState("");
  const [urlApplied, setUrlApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<number | null>(null);
  const [actionNotice, setActionNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (urlApplied) return;
    const tx = searchParams.get("tx");
    const st = searchParams.get("status");
    if (tx) setQ(tx);
    if (st) setStatus(st);
    if (tx || st) setUrlApplied(true);
  }, [searchParams, urlApplied]);

  const load = useCallback(async () => {
    const token = localStorage.getItem("access_token") || "";
    const params = new URLSearchParams({ page: String(page), per_page: "15" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (riskMin) params.set("risk_min", riskMin);
    if (country) params.set("country", country);
    setLoading(true);
    try {
      const res = await fetchWithAuth<PaginatedTransactions>(`/transactions/list?${params}`, token);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, q, status, riskMin, country]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAction = async (id: number, action: string) => {
    const token = localStorage.getItem("access_token") || "";
    setActionBusy(id);
    setActionNotice(null);
    try {
      const res = await patchWithAuth<{ message: string; status: string }>(
        `/transactions/${id}/action`,
        { action },
        token
      );
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((t) => (t.id === id ? { ...t, status: res.status } : t)),
        };
      });
      const label =
        action === "flag"
          ? "flagged"
          : action === "safe"
            ? "marked safe"
            : action === "freeze_account"
              ? "user suspended"
              : "updated";
      setActionNotice({ tone: "ok", text: `Transaction #${id} ${label}.` });
      void load();
    } catch (e) {
      setActionNotice({ tone: "err", text: (e as Error).message });
    } finally {
      setActionBusy(null);
    }
  };

  useEffect(() => {
    if (!actionNotice) return;
    const t = window.setTimeout(() => setActionNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [actionNotice]);

  const rows: TransactionRow[] = data?.items ?? [];

  return (
    <RoleGuard allow={["analyst", "admin"]} title="Transaction monitoring">
    <AppShell title="Transaction monitoring" subtitle="Live activity and queue controls">
      <div className="space-y-4">
        <div className="glass-card flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[140px] flex-1">
            <label className="text-soft text-xs">Search</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="ID, merchant, location…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div>
            <label className="text-soft text-xs">Status</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Any</option>
              <option value="flagged">Flagged</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div>
            <label className="text-soft text-xs">Min risk</label>
            <input
              type="number"
              className="mt-1 w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={riskMin}
              onChange={(e) => setRiskMin(e.target.value)}
            />
          </div>
          <div>
            <label className="text-soft text-xs">Country</label>
            <input
              className="mt-1 w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              void load();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
          >
            <Filter className="h-4 w-4" />
            Apply
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {actionNotice ? (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              actionNotice.tone === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            }`}
            role="status"
          >
            {actionNotice.text}
          </div>
        ) : null}

        {loading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/80">
                <tr className="text-soft text-left">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Card</th>
                  <th className="px-3 py-2">Merchant</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">IP / Device</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Conf.</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tx) => {
                  const highlighted = highlightTx === String(tx.id);
                  return (
                  <tr
                    key={tx.id}
                    className={`border-t border-slate-100 transition dark:border-slate-800 ${
                      highlighted ? "bg-cyan-50/80 ring-1 ring-inset ring-cyan-400/40 dark:bg-cyan-950/30" : ""
                    } ${actionBusy === tx.id ? "opacity-70" : ""}`}
                  >
                    <td className="px-3 py-2 font-mono text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => router.push(transactionDetailHref(tx.id))}
                        className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                      >
                        #{tx.id}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      {tx.card_type ?? "—"} ·••• {tx.card_last4 ?? "—"}
                    </td>
                    <td className="px-3 py-2">{tx.merchant || "—"}</td>
                    <td className="px-3 py-2">
                      {tx.location}
                      {tx.country ? <span className="text-soft block text-xs">{tx.country}</span> : null}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div>{tx.ip_address || "—"}</div>
                      <div className="text-soft truncate max-w-[140px]">{tx.device_id || "—"}</div>
                    </td>
                    <td className="px-3 py-2 font-semibold">{tx.risk_score.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-3 py-2">
                      {typeof tx.confidence === "number"
                        ? `${(tx.confidence <= 1 ? tx.confidence * 100 : tx.confidence).toFixed(0)}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 dark:border-red-900 dark:text-red-400"
                          onClick={() => void onAction(tx.id, "flag")}
                        >
                          Flag
                        </button>
                        <button
                          type="button"
                          className="rounded border border-emerald-200 px-2 py-0.5 text-xs text-emerald-800 dark:border-emerald-900 dark:text-emerald-400"
                          onClick={() => void onAction(tx.id, "safe")}
                        >
                          Safe
                        </button>
                        <button
                          type="button"
                          className="rounded border border-amber-200 px-2 py-0.5 text-xs text-amber-800 dark:border-amber-900 dark:text-amber-300"
                          onClick={() => void onAction(tx.id, "freeze_account")}
                        >
                          Freeze acct
                        </button>
                        <ChevronRight className="ml-1 h-4 w-4 text-slate-400" aria-hidden />
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs dark:border-slate-800">
            <span className="text-soft">
              Page {data?.page ?? page} / {data?.pages ?? 1} · {data?.total ?? 0} rows
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                disabled={data ? page >= data.pages : true}
                className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </AppShell>
    </RoleGuard>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "";
  const styles =
    s === "flagged"
      ? "bg-red-500/15 text-red-700 dark:text-red-300"
      : s === "approved"
        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
        : "bg-slate-500/15 text-slate-600 dark:text-slate-300";
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize ${styles}`}>
      {status || "—"}
    </span>
  );
}

function ActionButton({
  label,
  tone,
  disabled,
  busy,
  onClick,
}: {
  label: string;
  tone: "flag" | "safe" | "freeze";
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  const toneClass = {
    flag: "border-red-300 bg-red-50 text-red-800 hover:bg-red-100 active:bg-red-200 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950",
    safe: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 active:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950",
    freeze:
      "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 active:bg-amber-200 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950",
  }[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-md border px-2.5 py-1 text-xs font-semibold shadow-sm transition-all duration-150 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${
        busy ? "scale-95 opacity-60" : "hover:-translate-y-px active:translate-y-0"
      }`}
    >
      {busy ? "…" : label}
    </button>
  );
}
