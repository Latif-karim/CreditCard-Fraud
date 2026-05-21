"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ChartAreaSkeleton, FormPanelSkeleton } from "@/components/skeletons";
import { HorizontalFeatureChart } from "@/components/charts/horizontal-feature-chart";
import { ScrollReveal } from "@/components/scroll-reveal";
import { fetchWithAuth } from "@/lib/api";
import type { ExplainTransactionResponse } from "@/lib/types";

export default function ExplainPage() {
  const searchParams = useSearchParams();
  const [txId, setTxId] = useState("");
  const [data, setData] = useState<ExplainTransactionResponse | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id?: string) => {
    setErr("");
    const token = localStorage.getItem("access_token") || "";
    const target = (id ?? txId).trim();
    if (!target) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth<ExplainTransactionResponse>(`/fraud/explain/${target}`, token);
      setData(res);
      setTxId(target);
    } catch {
      setData(null);
      setErr("Could not load explanation (invalid ID or no access).");
    } finally {
      setLoading(false);
    }
  }, [txId]);

  useEffect(() => {
    const fromUrl = searchParams.get("tx");
    if (fromUrl) {
      setTxId(fromUrl);
      void load(fromUrl);
    }
  }, [searchParams, load]);

  return (
    <AppShell title="AI explainability" subtitle="Interpretability & transparency">
      <div className="glass-card mb-4 flex flex-wrap items-end gap-2 p-4">
        <div className="min-w-[200px] flex-1">
          <label className="text-soft text-xs">Transaction ID</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="e.g. 12"
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={!txId.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
        >
          <Search className="h-4 w-4" />
          Explain
        </button>
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {loading ? (
        <div className="space-y-4">
          <FormPanelSkeleton />
          <ChartAreaSkeleton className="min-h-[260px]" />
        </div>
      ) : null}
      {!loading && data ? (
        <div className="space-y-4">
          <div className="glass-card grid gap-3 p-4 sm:grid-cols-3">
            <div>
              <p className="text-soft text-xs">Risk</p>
              <p className="text-xl font-semibold">{data.risk_score.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-soft text-xs">ML probability</p>
              <p className="text-xl font-semibold">{(data.ml_probability * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-soft text-xs">Decision</p>
              <p className="text-xl font-semibold capitalize">{data.decision_label}</p>
            </div>
          </div>
          <div className="glass-card p-4">
            <h3 className="mb-2 text-sm font-semibold">Stored reasons</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              {data.stored_reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <ScrollReveal placeholderClassName="min-h-[260px]">
            <HorizontalFeatureChart
              title="Feature influence ranking"
              rows={data.feature_importance.map((f) => ({ feature: f.feature, contribution: f.contribution }))}
            />
          </ScrollReveal>
          <p className="text-soft text-xs">
            Feature influence rankings help analysts understand why a transaction received its risk score.
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}
