"use client";

import { ROLE_DESCRIPTIONS, ROLE_LABELS, type AppRole } from "@/lib/roles";
import { useUserRole } from "@/lib/use-user-role";

const TONE: Record<AppRole, string> = {
  user: "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100",
  analyst: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  admin: "border-violet-500/30 bg-violet-500/10 text-violet-950 dark:text-violet-100",
};

export function RoleBanner() {
  const role = useUserRole();
  if (!role) return null;

  return (
    <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${TONE[role]}`}>
      <p className="font-semibold">{ROLE_LABELS[role]} workspace</p>
      <p className="mt-1 opacity-90">{ROLE_DESCRIPTIONS[role]}</p>
    </div>
  );
}
