"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { ChartAreaSkeleton, Skeleton } from "@/components/skeletons";
import { HorizontalFeatureChart } from "@/components/charts/horizontal-feature-chart";
import { ScrollReveal } from "@/components/scroll-reveal";
import { postWithAuth } from "@/lib/api";
import type { FraudSimulateResponse } from "@/lib/types";

export default function FraudLabPage() {
  const [userId, setUserId] = useState("1");
  const [amount, setAmount] = useState("850");
  const [location, setLocation] = useState("London");
  const [persist, setPersist] = useState(false);
  const [result, setResult] = useState<FraudSimulateResponse | null>(null);
  const [err, setErr] = useState("");
  const [running, setRunning] = useState(false);

  const run = async () => {
    setErr("");
    setRunning(true);
    const token = localStorage.getItem("access_token") || "";
    try {
      const res = await postWithAuth<FraudSimulateResponse>(
        "/fraud/simulate",
        {
          user_id: Number(userId),
          amount: Number(amount),
          location,
          persist,
        },
        token
      );
      setResult(res);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <RoleGuard allow={["analyst", "admin"]} title="Risk analysis">
    <AppShell title="Fraud detection lab" subtitle="Test transactions and review scoring">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="glass-card space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FlaskConical className="h-4 w-4" />
            Transaction inputs
          </div>
          <label className="text-soft text-xs">User ID</label>
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <label className="text-soft text-xs">Amount</label>
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <label className="text-soft text-xs">Location</label>
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
              className="rounded border-slate-300"
            />
            Save to database (off = score only, no row created)
          </label>
          <button
            type="button"
            onClick={() => void run()}
            className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
          >
            Run detection
          </button>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
        </div>

        <div className="space-y-4">
          {running ? (
            <div className="space-y-4">
              <div className="glass-card grid gap-3 p-4 sm:grid-cols-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <ChartAreaSkeleton className="min-h-[260px]" />
            </div>
          ) : result ? (
            <>
              <div className="glass-card grid gap-3 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-soft text-xs">Risk score</p>
                  <p className="text-2xl font-semibold">{result.risk_score.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-soft text-xs">ML probability</p>
                  <p className="text-2xl font-semibold">{(result.ml_probability * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-soft text-xs">Band</p>
                  <p className="text-2xl font-semibold capitalize">{result.label}</p>
                </div>
              </div>
              {result.persisted && result.transaction_id ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Saved as transaction #{result.transaction_id} ({result.status}).
                </p>
              ) : (
                <p className="text-soft text-xs">
                  Simulation only — enable “Save to database” to create a transaction row.
                </p>
              )}
              <div className="glass-card p-4">
                <h3 className="mb-2 text-sm font-semibold">Narrative</h3>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{result.narrative}</p>
                <ul className="text-soft mt-3 list-disc space-y-1 pl-5 text-sm">
                  {result.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <ScrollReveal placeholderClassName="min-h-[260px]">
                <HorizontalFeatureChart
                  title="Feature influence"
                  rows={result.feature_importance.map((f) => ({ feature: f.feature, contribution: f.contribution }))}
                />
              </ScrollReveal>
            </>
          ) : (
            <div className="glass-card p-6 text-sm text-slate-600 dark:text-slate-300">
              Enter transaction details and run the fraud detection pipeline. Results include risk score, decision
              label, and key factors that influenced the outcome.
            </div>
          )}
        </div>
      </div>
    </AppShell>
    </RoleGuard>
  );
}
