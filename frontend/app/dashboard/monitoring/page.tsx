"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { fetchWithAuth, patchWithAuth } from "@/lib/api";
import type { PaginatedTransactions, TransactionRow } from "@/lib/types";

export default function MonitoringPage() {
  const [data, setData] = useState<PaginatedTransactions | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [riskMin, setRiskMin] = useState("");
  const [country, setCountry] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("access_token") || "";
    const params = new URLSearchParams({ page: String(page), per_page: "15" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (riskMin) params.set("risk_min", riskMin);
    if (country) params.set("country", country);
    try {
      const res = await fetchWithAuth<PaginatedTransactions>(`/transactions/list?${params}`, token);
      setData(res);
    } catch {
      setData(null);
    }
  }, [page, q, status, riskMin, country]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAction = async (id: number, action: string) => {
    const token = localStorage.getItem("access_token") || "";
    try {
      await patchWithAuth(`/transactions/${id}/action`, { action }, token);
      void load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const rows: TransactionRow[] = data?.items ?? [];

  return (
    <RoleGuard allow={["analyst", "admin"]} title="Transaction monitoring">
    <AppShell title="Transaction monitoring" subtitle="Real-time stream & controls">
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
                  <th className="px-3 py-2">Conf.</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-mono text-xs">{tx.id}</td>
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
                      {typeof tx.confidence === "number"
                        ? `${(tx.confidence <= 1 ? tx.confidence * 100 : tx.confidence).toFixed(0)}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 dark:border-red-900 dark:text-red-400"
                          onClick={() => onAction(tx.id, "flag")}
                        >
                          Flag
                        </button>
                        <button
                          type="button"
                          className="rounded border border-emerald-200 px-2 py-0.5 text-xs text-emerald-800 dark:border-emerald-900 dark:text-emerald-400"
                          onClick={() => onAction(tx.id, "safe")}
                        >
                          Safe
                        </button>
                        <button
                          type="button"
                          className="rounded border border-amber-200 px-2 py-0.5 text-xs text-amber-800 dark:border-amber-900 dark:text-amber-300"
                          onClick={() => onAction(tx.id, "freeze_account")}
                        >
                          Freeze acct
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
      </div>
    </AppShell>
    </RoleGuard>
  );
}
