"use client";

import { useEffect, useState } from "react";

import { peekApiCache } from "@/lib/api-cache";
import { getStoredToken } from "@/lib/api";

/** Read sessionStorage API cache only after mount (never in useState initializers). */
export function readClientApiCache<T>(path: string, fallback: T): T {
  const token = getStoredToken();
  if (!token) return fallback;
  return peekApiCache<T>(path, token) ?? fallback;
}

/** True after mount — pair with empty SSR-safe state defaults. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

/**
 * After hydration, load cached API payload once.
 * Keeps the first client render identical to SSR output.
 */
export function useClientApiCache<T>(path: string, fallback: T): { data: T; ready: boolean } {
  const hydrated = useHydrated();
  const [data, setData] = useState(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    setData(readClientApiCache(path, fallback));
    setReady(true);
  }, [hydrated, path, fallback]);

  return { data, ready: hydrated && ready };
}
