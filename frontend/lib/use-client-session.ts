"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AUTH_CHANGED_EVENT, clearClientSession } from "@/lib/auth-session";

export function useClientSession() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  const refresh = useCallback(() => {
    setLoggedIn(Boolean(typeof window !== "undefined" && localStorage.getItem("access_token")));
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

  const logout = useCallback(() => {
    clearClientSession();
    router.push("/login");
  }, [router]);

  return { loggedIn, logout };
}
