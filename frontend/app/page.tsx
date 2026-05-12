import Link from "next/link";
import { Activity, BellRing, Fingerprint, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="glass-card flex items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">FraudShield</h1>
          <div className="flex gap-2 text-sm">
            <Link href="/login" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
              Login
            </Link>
            <Link href="/dashboard" className="rounded-lg bg-slate-800 px-4 py-2 hover:bg-slate-700">
              Dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="glass-card p-8">
            <p className="text-soft text-xs uppercase tracking-[0.2em]">Real-time Fraud Intelligence</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-[44px]">
              Modern fraud defense for digital payments.
            </h2>
            <p className="text-soft mt-5 max-w-xl text-base leading-7">
              Monitor transactions, score risk with machine learning, and give analysts instant context
              through a fintech-grade command center.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-medium">
              <Link href="/dashboard" className="rounded-lg bg-slate-100 px-5 py-3 text-slate-900 hover:bg-white">
                Explore Dashboard
              </Link>
              <Link href="/login" className="rounded-lg border border-slate-700 px-5 py-3 hover:bg-slate-800">
                Sign In
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatChip label="Fraud prevented" value="$12.7M" />
              <StatChip label="Model precision" value="96.2%" />
              <StatChip label="Avg decision" value="32ms" />
            </div>
          </div>

          <div className="glass-card p-6">
            <p className="text-soft text-xs uppercase tracking-[0.2em]">Live Snapshot</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-soft text-xs">Transactions monitored</p>
                <p className="mt-1 text-xl font-semibold">184,230</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-soft text-xs">Fraud blocked today</p>
                <p className="mt-1 text-xl font-semibold">1,452</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-soft text-xs">Average decision time</p>
                <p className="mt-1 text-xl font-semibold">32 ms</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={Activity} title="Real-time Monitoring" copy="Evaluate incoming payments in milliseconds with deterministic checks." />
          <FeatureCard icon={ShieldCheck} title="ML Fraud Scoring" copy="Probability-driven risk engine with model-backed confidence." />
          <FeatureCard icon={Fingerprint} title="Behavior Profiling" copy="Track normal customer behavior and detect anomalies quickly." />
          <FeatureCard icon={BellRing} title="Alerts & Response" copy="Notify teams instantly and route suspicious transactions for review." />
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Activity;
  title: string;
  copy: string;
}) {
  return (
    <div className="glass-card p-4">
      <Icon className="h-5 w-5 text-slate-200" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="text-soft mt-1 text-xs leading-6">{copy}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
      <p className="text-soft text-[11px]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
