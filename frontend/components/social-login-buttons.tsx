"use client";

import { useEffect, useState } from "react";

import { getApiBase } from "@/lib/api";

type OAuthProviders = { google: boolean; github: boolean };

type LoadState = "loading" | "ready" | "api_down" | "not_configured";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Social sign-in failed. Please try again.",
  oauth_ssl_error:
    "Could not verify the identity provider's security certificate. Contact your administrator.",
  oauth_network_error:
    "Could not reach Google/GitHub. Check your internet connection and DNS, then try again.",
  google_not_configured: "Google sign-in is currently unavailable.",
  github_not_configured: "GitHub sign-in is currently unavailable.",
  account_suspended: "This account has been suspended.",
  awaiting_approval: "This account is awaiting administrator approval.",
};

export function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? "Sign-in could not be completed.";
}

type SocialLoginButtonsProps = {
  className?: string;
  compact?: boolean;
};

export function SocialLoginButtons({ className = "", compact = true }: SocialLoginButtonsProps) {
  const [providers, setProviders] = useState<OAuthProviders | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const apiBase = getApiBase();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/auth/oauth/providers`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as OAuthProviders;
        if (cancelled) return;
        setProviders(data);
        if (data.google || data.github) {
          setLoadState("ready");
        } else {
          setLoadState("not_configured");
        }
      } catch {
        if (cancelled) return;
        setProviders({ google: false, github: false });
        setLoadState("api_down");
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const startOAuth = (provider: "google" | "github") => {
    if (loadState !== "ready" || !providers?.[provider]) return;
    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;
    const dest = next && next.startsWith("/dashboard") ? next : "/dashboard";
    if (typeof window !== "undefined") {
      sessionStorage.setItem("oauth_next", dest);
    }
    window.location.href = `${apiBase}/auth/${provider}`;
  };

  const btnClass = compact
    ? "flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200/90 bg-white px-2 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700/70 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800"
    : "flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800";

  const disabledClass = "cursor-not-allowed opacity-50 hover:bg-white dark:hover:bg-slate-900";
  const googleAvailable = loadState === "ready" && Boolean(providers?.google);
  const githubAvailable = loadState === "ready" && Boolean(providers?.github);
  const unavailable = loadState === "api_down" || loadState === "not_configured";

  return (
    <div className={className}>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!googleAvailable}
          onClick={() => startOAuth("google")}
          className={`${btnClass} ${!googleAvailable ? disabledClass : ""}`}
          title={googleAvailable ? "Continue with Google" : "Google sign-in is currently unavailable"}
        >
          <GoogleIcon />
          {compact ? "Google" : "Continue with Google"}
        </button>
        <button
          type="button"
          disabled={!githubAvailable}
          onClick={() => startOAuth("github")}
          className={`${btnClass} ${!githubAvailable ? disabledClass : ""}`}
          title={githubAvailable ? "Continue with GitHub" : "GitHub sign-in is currently unavailable"}
        >
          <GitHubIcon />
          {compact ? "GitHub" : "Continue with GitHub"}
        </button>
      </div>
      {unavailable ? (
        <p className="text-soft mt-2 text-center text-xs">
          Social sign-in is currently unavailable. You can continue with email.
        </p>
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
