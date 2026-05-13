"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px -8% 0px" },
  transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] },
};

export default function LandingPage() {
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
              <Stat label="Transactions scored" value="1.2M+" />
              <Stat label="Median latency" value="32ms" />
              <Stat label="Analyst NPS" value="4.8/5" />
            </div>
          </motion.div>
          <motion.div {...fade} className="glass-card relative overflow-hidden p-6">
            <div className="relative space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live risk snapshot
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Mini label="Fraud blocked" value="$12.7M" tone="text-emerald-600 dark:text-emerald-400" />
                <Mini label="Queue depth" value="38" tone="text-amber-700 dark:text-amber-300" />
                <Mini label="Model PR-AUC" value="0.91" tone="text-sky-700 dark:text-sky-300" />
                <Mini label="False positive rate" value="2.1%" tone="text-slate-700 dark:text-slate-200" />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/60 p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">Explainable alert</p>
                <p className="mt-2 leading-relaxed">
                  “Velocity spike + foreign IP + amount 4× profile average → risk 87, SHAP-style drivers attached.”
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
                title="Ingest & enrich"
                body="Stream transactions with device, IP, merchant, and geo signals normalized to a risk schema."
              />
              <Step
                icon={Brain}
                title="Rules + ML fusion"
                body="Deterministic policies fire first, then calibrated ML probability blends with behavioral drift."
              />
              <Step
                icon={LineChart}
                title="Explain & act"
                body="Analysts review SHAP-style drivers, triage alerts, freeze accounts, and export evidence packs."
              />
            </div>
          </div>
        </section>

        <section id="stats" className="mx-auto max-w-6xl px-6 py-16">
          <motion.h2 {...fade} className="text-2xl font-semibold text-slate-900 dark:text-white">
            Trusted metrics
          </motion.h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BigStat value="99.992%" label="Authorization uptime" />
            <BigStat value="38ms" label="p99 scoring latency" />
            <BigStat value="120+" label="Risk dimensions tracked" />
            <BigStat value="SOC2-ready" label="Audit trails & RBAC" />
          </div>
        </section>

        <section id="demo" className="bg-slate-900 py-16 text-white dark:bg-black/40">
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
                  <Sparkles className="h-4 w-4" /> Exportable reports for regulators & thesis reviewers
                </li>
              </ul>
            </motion.div>
            <motion.div {...fade} className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-800/80 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
                alt="Analytics dashboard preview"
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-black/35" />
              <p className="absolute bottom-4 left-4 text-xs text-slate-200">Placeholder hero visual — swap for product screenshots.</p>
            </motion.div>
          </div>
        </section>

        <section id="team" className="mx-auto max-w-6xl px-6 py-16">
          <motion.div {...fade} className="glass-card flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Built for academic & production rigor</h2>
              <p className="text-soft mt-2 max-w-xl text-sm">
                FraudShield demonstrates responsible AI: interpretable scores, human-in-the-loop review, and audit-grade
                logging suitable for capstone defense and investor diligence.
              </p>
            </div>
            <LandingTeamCtas />
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-10 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} FraudShield · Risk & compliance demo stack (Next.js + Flask).
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
