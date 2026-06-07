"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  LineChart,
  Shield,
  Sparkles,
} from "lucide-react";

import { LandingNav } from "@/components/landing-nav";
import { LandingTeamCtas } from "@/components/landing-team-ctas";
import { ProductScreenshot } from "@/components/product-screenshot";
import { fetchPublic } from "@/lib/api";
import type { PublicStats } from "@/lib/types";

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px -8% 0px" },
  transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] },
};

function formatPercent(rate: number | undefined | null): string {
  if (rate == null || Number.isNaN(rate)) return "0.00%";
  return `${(rate * 100).toFixed(2)}%`;
}

function formatMetric(value: unknown): string {
  if (value == null) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  if (n >= 0 && n <= 1) return n.toFixed(3);
  return n.toFixed(2);
}

export default function LandingPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    void fetchPublic<PublicStats>("/public/stats")
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const transactionsLabel = stats ? stats.total_transactions.toLocaleString() : "—";
  const flaggedRateLabel = stats ? formatPercent(stats.fraud_rate) : "—";
  const protectedLabel = stats ? `$${Math.round(stats.revenue_protected ?? stats.flagged_volume ?? 0).toLocaleString()}` : "—";
  const queueLabel = stats ? String(stats.flagged_transactions) : "—";
  const prAucLabel = stats?.pr_auc != null ? formatMetric(stats.pr_auc) : "—";
  const precisionLabel = stats?.precision_at_alert != null ? formatPercent(stats.precision_at_alert) : "—";

  return (
    <div className="min-h-screen">
      <LandingNav />

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div {...fade}>
            <p className="text-soft flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em]">
              <Sparkles className="h-3 w-3" />
              Enterprise fraud intelligence
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white md:text-5xl">
              Real-time card fraud detection with explainable AI.
            </h1>
            <p className="text-soft mt-5 max-w-xl text-lg leading-relaxed">
              Unify rules, machine learning, and behavioral analytics in a single operations console built for fintech
              risk teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 dark:bg-white dark:text-slate-900"
              >
                Open console <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold dark:border-slate-700"
              >
                Create workspace
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <Stat label="Transactions captured" value={transactionsLabel} />
              <Stat label="Flagged rate" value={flaggedRateLabel} />
              <Stat label="Active users" value={stats ? String(stats.active_users ?? 0) : "—"} />
            </div>
          </motion.div>
          <motion.div {...fade} className="glass-card relative overflow-hidden p-6">
            <div className="relative space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live platform snapshot
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Mini label="Flagged volume" value={protectedLabel} tone="text-emerald-600 dark:text-emerald-400" />
                <Mini label="Queue depth" value={queueLabel} tone="text-amber-700 dark:text-amber-300" />
                <Mini label="Model PR-AUC" value={prAucLabel} tone="text-sky-700 dark:text-sky-300" />
                <Mini label="Alert precision" value={precisionLabel} tone="text-slate-700 dark:text-slate-200" />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/60 p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">Explainable alert</p>
                <p className="mt-2 leading-relaxed">
                  “Velocity spike + foreign IP + amount 4× profile average → risk 87, key drivers attached.”
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="how" className="border-y border-slate-200 bg-white/60 py-16 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-6">
            <motion.h2 {...fade} className="text-2xl font-semibold text-slate-900 dark:text-white">
              How fraud detection works
            </motion.h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Step
                icon={Activity}
                title="Process & enrich"
                body="Process transactions with device, IP, merchant, and geo signals normalized to a unified risk schema."
              />
              <Step
                icon={Brain}
                title="Rules + ML fusion"
                body="Deterministic policies fire first, then calibrated ML probability blends with behavioral drift."
              />
              <Step
                icon={LineChart}
                title="Explain & act"
                body="Analysts review feature drivers, triage alerts, freeze accounts, and export evidence packs."
              />
            </div>
          </div>
        </section>

        <section id="stats" className="mx-auto max-w-6xl px-6 py-16">
          <motion.h2 {...fade} className="text-2xl font-semibold text-slate-900 dark:text-white">
            Platform metrics
          </motion.h2>
          <p className="text-soft mt-2 text-sm">Aggregated from captured transactions and offline model evaluation.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BigStat value={transactionsLabel} label="Transactions captured" />
            <BigStat value={flaggedRateLabel} label="Flagged rate" />
            <BigStat value={prAucLabel} label="Model PR-AUC (offline)" />
            <BigStat value={stats ? String(stats.enabled_rules ?? 0) : "—"} label="Active fraud rules" />
          </div>
        </section>

        <section id="product" className="bg-slate-900 py-16 text-white dark:bg-black/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
            <motion.div {...fade}>
              <h2 className="text-2xl font-semibold">Product walkthrough</h2>
              <p className="text-slate-300 mt-3 text-sm leading-relaxed">
                Operations dashboard, live monitoring, fraud lab, explainability, alerts, and admin controls ship as
                first-class modules—mirroring how tier-1 fintechs structure risk platforms.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> KPIs, heatmaps, and regional fraud splits
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> RBAC for admin, analyst, and cardholder views
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Exportable reports for compliance and audit
                </li>
              </ul>
            </motion.div>
            <motion.div {...fade}>
              <ProductScreenshot />
            </motion.div>
          </div>
        </section>

        <section id="get-started" className="mx-auto max-w-6xl px-6 py-16">
          <motion.div {...fade} className="glass-card flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Ready to protect your payments?</h2>
              <p className="text-soft mt-2 max-w-xl text-sm">
                Deploy FraudShield to score transactions in real time, investigate alerts with explainable insights,
                and keep a complete audit trail for your risk team.
              </p>
            </div>
            <LandingTeamCtas />
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-10 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} FraudShield. All rights reserved.
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-soft text-[11px]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Activity;
  title: string;
  body: string;
}) {
  return (
    <motion.div {...fade} className="glass-card h-full p-5">
      <Icon className="h-5 w-5 text-slate-800 dark:text-slate-100" />
      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-soft mt-2 text-sm leading-relaxed">{body}</p>
    </motion.div>
  );
}

function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/70">
      <p className="text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      <p className="text-soft mt-1 text-sm">{label}</p>
    </div>
  );
}
