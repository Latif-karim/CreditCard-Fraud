"use client";

import { useCallback, useEffect, useState } from "react";

import { AUTH_CHANGED_EVENT } from "@/lib/auth-session";
import { type AppRole, parseRole } from "@/lib/roles";

export function useUserRole(): AppRole | null {
  const [role, setRole] = useState<AppRole | null>(null);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    setRole(parseRole(localStorage.getItem("role")));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(AUTH_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return role;
}
