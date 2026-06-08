"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchWithAuth } from "@/lib/api";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type AppRole } from "@/lib/roles";
import { useUserRole } from "@/lib/use-user-role";

const TONE: Record<AppRole, string> = {
  user: "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100",
  analyst: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  admin: "border-violet-500/30 bg-violet-500/10 text-violet-950 dark:text-violet-100",
};

export function RoleBanner() {
  const role = useUserRole();
  const [requestedRole, setRequestedRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    if (!token) return;
    void fetchWithAuth<{ requested_role?: string | null }>("/auth/me", token)
      .then((me) => setRequestedRole(me.requested_role ?? null))
      .catch(() => setRequestedRole(null));
  }, []);

  if (!role) return null;

  return (
    <div className="mb-5 space-y-3">
      <div className={`rounded-xl border px-4 py-3 text-sm ${TONE[role]}`}>
        <p className="font-semibold">{ROLE_LABELS[role]} workspace</p>
        <p className="mt-1 opacity-90">{ROLE_DESCRIPTIONS[role]}</p>
      </div>
      {requestedRole ? (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">
            {ROLE_LABELS[requestedRole as AppRole] ?? requestedRole} access pending approval
          </p>
          <p className="mt-1 text-xs opacity-90">
            You still have cardholder permissions until an administrator approves your request.{" "}
            <Link href="/dashboard/profile" className="font-medium underline underline-offset-2">
              View on profile
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
