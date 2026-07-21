"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  Layers,
  Lock,
  Radar,
  Shield,
  ShieldCheck,
  UserCog,
  Workflow,
} from "lucide-react";

import { LandingNav } from "@/components/landing-nav";
import { useClientSession } from "@/lib/use-client-session";
import { useHydrated } from "@/lib/use-hydrated";

const BTN_PRIMARY =
  "inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-slate-900/10 dark:bg-white dark:text-slate-900";

const BTN_SECONDARY =
  "inline-flex items-center rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60";

export default function LandingPage() {
  const hydrated = useHydrated();
  const { loggedIn } = useClientSession();

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <FraudShieldStyles />
      <LandingNav />

      <main>
        {/* Hero */}
        <section id="top" className="flex min-h-[calc(100vh-7rem)] flex-col justify-center py-10 sm:py-16 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
            <div className="text-center md:text-left">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
                For fraud analysts &amp; administrators
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
                Catch fraud in the moment it happens.
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400 md:mx-0">
                Every authorization is scored the instant it lands. Analysts triage what the models flag,
                admins tune the rules and retrain the brains behind it — one console, zero blind spots.
              </p>
              <LandingAuthCtas layout="hero" hydrated={hydrated} loggedIn={loggedIn} />

              <div className="mt-6 flex justify-center md:justify-start">
                <TransactionTicker />
              </div>
            </div>

            <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:max-w-md sm:p-6 md:mx-0 lg:max-w-lg">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span className="fs-anim fs-blink h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  Live fraud detection
                </span>
                <Radar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden />
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <FraudRadar />
                <div className="h-px w-full bg-slate-200/80 dark:bg-slate-800 sm:h-40 sm:w-px" aria-hidden />
                <FraudAlertScene />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-8 border-t border-slate-200/80 py-20 dark:border-slate-800">
          <SectionHeading
            title="How it works"
            subtitle="The pipeline scores every transaction automatically; analysts and admins pick up where the models leave off."
          />
          <div className="mt-12 space-y-10">
            <InfoRow
              icon={Workflow}
              title="Ingest & enrich"
              body="Incoming authorizations are normalized with merchant, device, location, and card context — ready for rules and deep learning scoring."
            />
            <InfoRow
              icon={Layers}
              title="Score & route"
              body="Rules fire first, then a hybrid CNN + autoencoder model assigns risk. High scores land in the analyst flagged queue; outcomes are logged for audit."
              scanning
              accent="danger"
            />
            <InfoRow
              icon={Eye}
              title="Review & govern"
              body="Analysts work the queue with explainability panels and dispute tools. Admins tune rules, approve new users, and retrain models from the admin console."
              accent="trust"
            />
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-8 border-t border-slate-200/80 py-20 dark:border-slate-800">
          <SectionHeading
            title="Built for two roles"
            subtitle="FraudShield is an internal operations platform — access is limited to analysts and administrators."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <RoleCard
              icon={ShieldCheck}
              role="Fraud analyst"
              summary="Day-to-day investigation and monitoring."
              items={ANALYST_ITEMS}
              accent="danger"
            />
            <RoleCard
              icon={UserCog}
              role="Administrator"
              summary="Platform governance and model operations."
              items={ADMIN_ITEMS}
              accent="trust"
            />
          </div>
          <p className="mt-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            New registrations start as pending analysts until an administrator approves the account and assigns
            the correct role. Sign in with email/password or social login once approved.
          </p>
        </section>

        {/* CTA */}
        <section id="get-started" className="scroll-mt-8 border-t border-slate-200/80 py-20 dark:border-slate-800">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/50 px-8 py-10 text-center dark:border-slate-800 dark:bg-slate-900/30 sm:px-12">
            <div className="fs-anim fs-cta-glow pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative">
              {hydrated && loggedIn ? (
                <>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Continue in the console</h2>
                  <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400">
                    You&apos;re signed in. Head to your dashboard to monitor transactions, review alerts, and
                    manage the platform.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Ready to sign in?</h2>
                  <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400">
                    Analysts and admins use the same entry point. Request access if your organization has not
                    provisioned your account yet.
                  </p>
                </>
              )}
              <LandingAuthCtas layout="cta" hydrated={hydrated} loggedIn={loggedIn} className="mt-7" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">FraudShield</span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-500">
              Deep learning fraud detection for analyst investigation and admin governance.
            </p>
          </div>

          <nav className="flex gap-12 text-sm">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Product</p>
              <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#roles" className="hover:text-slate-900 dark:hover:text-white">
                    Roles
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Account</p>
              <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-400">
                {hydrated && loggedIn ? (
                  <li>
                    <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white">
                      Dashboard
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">
                        Sign in
                      </Link>
                    </li>
                    <li>
                      <Link href="/register" className="hover:text-slate-900 dark:hover:text-white">
                        Request access
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </nav>
        </div>

        <div className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
          <span suppressHydrationWarning>© {new Date().getFullYear()} FraudShield. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function LandingAuthCtas({
  layout,
  hydrated,
  loggedIn,
  className = "",
}: {
  layout: "hero" | "cta";
  hydrated: boolean;
  loggedIn: boolean;
  className?: string;
}) {
  const wrapperClass =
    layout === "hero"
      ? `mt-9 flex flex-wrap items-center justify-center gap-3 md:justify-start ${className}`
      : `flex flex-wrap justify-center gap-3 ${className}`;

  if (!hydrated) {
    return (
      <div className={wrapperClass} aria-hidden>
        <span className="inline-block h-10 w-28 rounded-lg bg-slate-200/50 dark:bg-slate-800/50" />
        <span className="inline-block h-10 w-40 rounded-lg bg-slate-200/50 dark:bg-slate-800/50" />
      </div>
    );
  }

  if (loggedIn) {
    return (
      <div className={wrapperClass}>
        <Link href="/dashboard" className={BTN_PRIMARY}>
          Open dashboard
          {layout === "hero" && <ArrowRight className="h-4 w-4" />}
        </Link>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <Link href="/login" className={BTN_PRIMARY}>
        Sign in
        {layout === "hero" && <ArrowRight className="h-4 w-4" />}
      </Link>
      <Link href="/register" className={BTN_SECONDARY}>
        {layout === "hero" ? "Request analyst or admin access" : "Request access"}
      </Link>
    </div>
  );
}

const ANALYST_ITEMS = [
  "Live transaction feed & stream simulator",
  "Flagged queue with risk prioritization",
  "Deep learning explainability panel",
  "Dispute case management",
  "Regional heatmaps & analytics exports",
];

const ADMIN_ITEMS = [
  "User approval & role assignment",
  "Fraud rule configuration",
  "Model retrain & metrics dashboard",
  "Alert & email log oversight",
  "Platform maintenance controls",
];

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  title,
  body,
  scanning = false,
  accent,
}: {
  icon: typeof Workflow;
  title: string;
  body: string;
  scanning?: boolean;
  accent?: "danger" | "trust";
}) {
  const ring =
    accent === "danger"
      ? "border-rose-200/80 dark:border-rose-900/50"
      : accent === "trust"
        ? "border-teal-200/80 dark:border-teal-900/50"
        : "border-slate-200/80 dark:border-slate-800";

  const iconColor =
    accent === "danger"
      ? "text-rose-600 dark:text-rose-400"
      : accent === "trust"
        ? "text-teal-600 dark:text-teal-400"
        : "text-slate-700 dark:text-slate-300";

  return (
    <div className="flex gap-4 sm:gap-5">
      <div
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white/60 dark:bg-slate-900/40 ${ring}`}
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
        {scanning && (
          <span className="fs-anim fs-scan-line pointer-events-none absolute inset-x-0 h-px bg-rose-500/70 dark:bg-rose-400/70" aria-hidden />
        )}
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
      </div>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  role,
  summary,
  items,
  accent,
}: {
  icon: typeof ShieldCheck;
  role: string;
  summary: string;
  items: string[];
  accent: "danger" | "trust";
}) {
  const dot = accent === "danger" ? "bg-rose-400 dark:bg-rose-500" : "bg-teal-400 dark:bg-teal-500";
  const iconColor = accent === "danger" ? "text-rose-600 dark:text-rose-400" : "text-teal-600 dark:text-teal-400";

  return (
    <div className="group rounded-2xl border border-slate-200/80 p-6 transition-shadow hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{role}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-500">{summary}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Signature visuals: an animated radar sweep + a live transaction ticker */
/* ---------------------------------------------------------------------- */

type Blip = { x: number; y: number; flagged: boolean; delay: number };

const RADAR_BLIPS: Blip[] = [
  { x: 150, y: 80, flagged: true, delay: 0 },
  { x: 95, y: 150, flagged: false, delay: 0.6 },
  { x: 205, y: 145, flagged: false, delay: 1.1 },
  { x: 150, y: 205, flagged: true, delay: 1.7 },
  { x: 110, y: 105, flagged: false, delay: 2.2 },
  { x: 190, y: 195, flagged: false, delay: 2.8 },
];

function FraudRadar() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[10.5rem] sm:max-w-[12rem]">
      <svg viewBox="0 0 300 300" className="w-full" role="img" aria-label="Animated radar visualizing live transaction risk scanning, with flagged transactions highlighted">
        <defs>
          <radialGradient id="fs-radar-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="text-slate-400 dark:text-slate-600">
          <circle cx="150" cy="150" r="120" fill="none" stroke="currentColor" strokeOpacity="0.25" />
          <circle cx="150" cy="150" r="80" fill="none" stroke="currentColor" strokeOpacity="0.25" />
          <circle cx="150" cy="150" r="40" fill="none" stroke="currentColor" strokeOpacity="0.25" />
          <line x1="150" y1="30" x2="150" y2="270" stroke="currentColor" strokeOpacity="0.15" />
          <line x1="30" y1="150" x2="270" y2="150" stroke="currentColor" strokeOpacity="0.15" />
        </g>

        <g className="fs-anim fs-sweep origin-center text-teal-500 dark:text-teal-400" style={{ transformOrigin: "150px 150px" }}>
          <path d="M150 150 L150 30 A120 120 0 0 1 253.9 90 Z" fill="url(#fs-radar-fade)" />
        </g>

        {RADAR_BLIPS.map((blip, i) => (
          <g key={i}>
            <circle
              cx={blip.x}
              cy={blip.y}
              r={blip.flagged ? 5 : 4}
              className={blip.flagged ? "fill-rose-500 dark:fill-rose-400" : "fill-teal-500 dark:fill-teal-400"}
            />
            {blip.flagged && (
              <circle
                cx={blip.x}
                cy={blip.y}
                r={5}
                className="fs-anim fs-blip-ping fill-none stroke-rose-500 dark:stroke-rose-400"
                style={{ animationDelay: `${blip.delay}s` }}
              />
            )}
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden /> Flagged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden /> Cleared
        </span>
      </div>
    </div>
  );
}

function FraudAlertScene() {
  return (
    <div className="relative flex flex-1 items-center justify-center py-2">
      {/* floating fraud-related badges */}
      <span
        className="fs-anim fs-float absolute left-1 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 sm:left-3"
        aria-hidden
      >
        <CreditCard className="h-3.5 w-3.5" />
      </span>
      <span
        className="fs-anim fs-float absolute right-1 top-7 flex h-7 w-7 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-600 shadow-sm dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-400 sm:right-3"
        style={{ animationDelay: "1.3s" }}
        aria-hidden
      >
        <ShieldCheck className="h-3.5 w-3.5" />
      </span>
      <span
        className="fs-anim fs-float absolute bottom-3 left-4 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:left-6"
        style={{ animationDelay: "2.4s" }}
        aria-hidden
      >
        <Lock className="h-3 w-3" />
      </span>

      {/* phone mockup */}
      <div className="relative h-56 w-28 rounded-[1.5rem] border-[3px] border-slate-900 bg-slate-950 p-1 shadow-xl dark:border-slate-600 sm:h-64 sm:w-32">
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500" aria-hidden />
        <span className="fs-anim fs-ping absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500" aria-hidden />

        <div className="relative h-full w-full overflow-hidden rounded-[1.1rem] bg-gradient-to-b from-slate-800 to-slate-950">
          <div className="absolute left-1/2 top-1.5 h-1.5 w-8 -translate-x-1/2 rounded-full bg-slate-950" aria-hidden />

          <div className="flex justify-between px-2.5 pt-3.5 text-[7px] font-medium text-slate-400">
            <span>9:41</span>
            <span>●●●</span>
          </div>

          <div className="fs-anim fs-notif-slide mx-1.5 mt-6 rounded-lg border border-rose-400/40 bg-rose-950/80 px-2 py-1.5 shadow-lg backdrop-blur">
            <div className="flex items-center gap-1 text-[8px] font-semibold text-rose-300">
              <AlertTriangle className="h-2 w-2" aria-hidden />
              Fraud alert
            </div>
            <p className="mt-0.5 text-[7px] leading-snug text-rose-100/90">
              $1,240 blocked · Lagos, NG
            </p>
          </div>

          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-teal-500/15 px-2 py-1 text-[7px] font-medium text-teal-300">
            <ShieldCheck className="h-2 w-2" aria-hidden />
            Protected
          </div>
        </div>
      </div>
    </div>
  );
}

type Tx = { amount: string; place: string; flagged: boolean };

const TICKER_TX: Tx[] = [
  { amount: "$1,240", place: "Lagos, NG", flagged: true },
  { amount: "$86", place: "Austin, TX", flagged: false },
  { amount: "$12,900", place: "Singapore", flagged: true },
  { amount: "$45", place: "Berlin, DE", flagged: false },
  { amount: "$3,200", place: "Toronto, CA", flagged: false },
  { amount: "$980", place: "Manila, PH", flagged: true },
];

function TransactionTicker() {
  const items = [...TICKER_TX, ...TICKER_TX];

  return (
    <div className="fs-ticker-mask w-full max-w-md overflow-hidden">
      <div className="fs-anim fs-ticker-scroll flex w-max gap-2.5">
        {items.map((tx, i) => (
          <span
            key={i}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
              tx.flagged
                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                : "border-slate-200 bg-white/70 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400"
            }`}
          >
            {tx.flagged ? (
              <AlertTriangle className="h-3 w-3" aria-hidden />
            ) : (
              <CheckCircle2 className="h-3 w-3" aria-hidden />
            )}
            {tx.amount}
            <span className="opacity-60">· {tx.place}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function FraudShieldStyles() {
  return (
    <style>{`
      @keyframes fs-sweep-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes fs-blip-ping-kf {
        0% { opacity: 0.9; r: 5; }
        75%, 100% { opacity: 0; r: 16; }
      }
      @keyframes fs-blink-kf {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.25; }
      }
      @keyframes fs-scan-line-kf {
        0% { top: 0%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }
      @keyframes fs-ticker-scroll-kf {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      @keyframes fs-cta-glow-kf {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      @keyframes fs-float-kf {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes fs-notif-slide-kf {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fs-ping-kf {
        0% { transform: scale(1); opacity: 0.7; }
        75%, 100% { transform: scale(2.4); opacity: 0; }
      }

      .fs-sweep { animation: fs-sweep-rotate 6s linear infinite; }
      .fs-blip-ping { animation: fs-blip-ping-kf 2.4s ease-out infinite; }
      .fs-blink { animation: fs-blink-kf 2s ease-in-out infinite; }
      .fs-scan-line { animation: fs-scan-line-kf 3.2s ease-in-out infinite; }
      .fs-ticker-scroll { animation: fs-ticker-scroll-kf 22s linear infinite; }
      .fs-float { animation: fs-float-kf 4s ease-in-out infinite; }
      .fs-notif-slide {
        opacity: 0;
        animation: fs-notif-slide-kf 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards;
      }
      .fs-ping { animation: fs-ping-kf 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }
      .fs-ticker-mask {
        -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
      }
      .fs-cta-glow {
        background: radial-gradient(60% 100% at 50% 0%, rgba(45,212,191,0.10), transparent 70%);
        animation: fs-cta-glow-kf 5s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .fs-anim { animation: none !important; }
        .fs-notif-slide { opacity: 1 !important; transform: none !important; }
      }
    `}</style>
  );
}
