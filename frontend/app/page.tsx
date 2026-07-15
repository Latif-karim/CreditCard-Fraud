"use client";

import Link from "next/link";
import { ArrowRight, Eye, Layers, Shield, ShieldCheck, UserCog, Workflow } from "lucide-react";

import { LandingNav } from "@/components/landing-nav";
import { useClientSession } from "@/lib/use-client-session";
import { useHydrated } from "@/lib/use-hydrated";

const BTN_PRIMARY =
  "inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900";

const BTN_SECONDARY =
  "inline-flex items-center rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60";

export default function LandingPage() {
  const hydrated = useHydrated();
  const { loggedIn } = useClientSession();

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-6">
      <LandingNav />

      <main>
        {/* Hero */}
        <section id="top" className="flex min-h-[calc(100vh-7rem)] flex-col justify-center py-12 text-center sm:py-20">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
            For fraud analysts &amp; administrators
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Your fraud operations console
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Investigate flagged payments, explain model decisions, and keep the platform running — whether
            you triage alerts as an analyst or manage users, rules, and models as an admin.
          </p>
          <LandingAuthCtas layout="hero" hydrated={hydrated} loggedIn={loggedIn} />
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
            />
            <InfoRow
              icon={Eye}
              title="Review & govern"
              body="Analysts work the queue with explainability panels and dispute tools. Admins tune rules, approve new users, and retrain models from the admin console."
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
            />
            <RoleCard
              icon={UserCog}
              role="Administrator"
              summary="Platform governance and model operations."
              items={ADMIN_ITEMS}
            />
          </div>
          <p className="mt-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            New registrations start as pending analysts until an administrator approves the account and assigns
            the correct role. Sign in with email/password or social login once approved.
          </p>
        </section>

        {/* CTA */}
        <section id="get-started" className="scroll-mt-8 border-t border-slate-200/80 py-20 dark:border-slate-800">
          <div className="rounded-2xl border border-slate-200/80 bg-white/50 px-8 py-10 text-center dark:border-slate-800 dark:bg-slate-900/30 sm:px-12">
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
      ? `mt-9 flex flex-wrap items-center justify-center gap-3 ${className}`
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
}: {
  icon: typeof Workflow;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 sm:gap-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40">
        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
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
}: {
  icon: typeof ShieldCheck;
  role: string;
  summary: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 p-6 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40">
          <Icon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{role}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-500">{summary}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-slate-300 dark:text-slate-600" aria-hidden>
              ·
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
