"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { HorizontalFeatureChart } from "@/components/charts/horizontal-feature-chart";
import { ScrollReveal } from "@/components/scroll-reveal";
import { fetchWithAuth } from "@/lib/api";
import type { ExplainTransactionResponse } from "@/lib/types";

export default function ExplainPage() {
  const [txId, setTxId] = useState("");
  const [data, setData] = useState<ExplainTransactionResponse | null>(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    const token = localStorage.getItem("access_token") || "";
    if (!txId.trim()) return;
    try {
      const res = await fetchWithAuth<ExplainTransactionResponse>(`/fraud/explain/${txId.trim()}`, token);
      setData(res);
    } catch {
      setData(null);
      setErr("Could not load explanation (invalid ID or no access).");
    }
  };

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
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
        >
          <Search className="h-4 w-4" />
          Explain
        </button>
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {data ? (
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
              title="SHAP-style feature ranking (approximation)"
              rows={data.feature_importance.map((f) => ({ feature: f.feature, contribution: f.contribution }))}
            />
          </ScrollReveal>
          <p className="text-soft text-xs">
            This view uses a transparent approximation for academic demonstration. Production systems should integrate
            true SHAP or integrated gradients from the deployed model.
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}
