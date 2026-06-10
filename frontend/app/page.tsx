"use client";

import Link from "next/link";
import { ArrowRight, Brain, Eye, Shield, Workflow } from "lucide-react";

import { LandingNav } from "@/components/landing-nav";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.12),transparent)]"
        aria-hidden
      />

      <LandingNav />

      <main className="mx-auto max-w-4xl px-6">
        <section className="pb-16 pt-20 text-center md:pb-20 md:pt-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-300">
            <Shield className="h-3.5 w-3.5 text-sky-600 dark:text-cyan-400" />
            Deep learning fraud operations
          </div>

          <h1 className="mt-8 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
            Stop fraudulent payments
            <span className="block text-slate-500 dark:text-slate-400">before they clear.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            FraudShield scores authorizations with CNN and autoencoder models, layered rules, and behavioral
            analytics — built for fraud analyst teams.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:shadow-xl dark:bg-white dark:text-slate-900 dark:shadow-black/20"
            >
              Sign in to console
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-6 py-2.5 text-sm font-medium text-slate-800 backdrop-blur-sm transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              Request analyst access
            </Link>
          </div>
        </section>

        <section className="pb-20" aria-label="Detection pipeline">
          <div className="glass-card mx-auto max-w-3xl p-6 sm:p-8">
            <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center sm:gap-2">
              <PipelineStep icon={Workflow} label="Ingest" detail="Live authorizations" />
              <PipelineArrow />
              <PipelineStep icon={Brain} label="Score" detail="Rules + DL hybrid" />
              <PipelineArrow />
              <PipelineStep icon={Eye} label="Review" detail="Explainable alerts" />
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-slate-200/80 pb-24 pt-16 dark:border-slate-800">
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              title="Hybrid scoring"
              body="1D-CNN classifier fused with an autoencoder anomaly signal on every transaction."
            />
            <FeatureCard
              title="Analyst-first UI"
              body="Flagged queues, live monitoring, and dispute workflows in one console."
            />
            <FeatureCard
              title="Audit ready"
              body="Decision traces, feature attribution, and exportable reports for compliance."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        <span suppressHydrationWarning>© {new Date().getFullYear()} FraudShield</span>
      </footer>
    </div>
  );
}

function PipelineStep({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof Workflow;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="hidden shrink-0 text-slate-300 dark:text-slate-600 sm:block" aria-hidden>
      <ArrowRight className="h-5 w-5" />
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 backdrop-blur-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:shadow-black/20">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
    </div>
  );
}
