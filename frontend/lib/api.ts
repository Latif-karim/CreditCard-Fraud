import {
  apiCacheKey,
  invalidateAfterMutation,
  invalidateApiCache,
  peekApiCache,
  readApiCacheEntry,
  writeApiCache,
} from "@/lib/api-cache";
import { clearClientSession } from "@/lib/auth-session";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5000";
/** Fresh window: serve cache only, no network. */
const DEFAULT_CACHE_TTL_MS = 120_000;
/** Stale window: show cache immediately, refresh in background. */
const DEFAULT_CACHE_MAX_MS = 600_000;

export type FetchWithAuthOptions = {
  /** Fresh TTL in ms; 0 disables cache for this request. */
  cacheTtlMs?: number;
  /** Max stale age before forcing a network fetch. */
  cacheMaxMs?: number;
  forceRefresh?: boolean;
};

export { invalidateApiCache, peekApiCache };

const inflight = new Map<string, Promise<unknown>>();

export function getApiBase() {
  return API_BASE;
}

export function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") || "";
}

export class AuthError extends Error {
  constructor(message = "Session expired. Please sign in again.") {
    super(message);
    this.name = "AuthError";
  }
}

let redirecting = false;

/** Clear session and send user to login (invalid or expired JWT). */
export function handleUnauthorized(): void {
  if (typeof window === "undefined" || redirecting) return;
  redirecting = true;
  clearClientSession();
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?next=${encodeURIComponent(next)}&reason=session_expired`;
}

function formatApiError(status: number, data: unknown): string {
  if (status === 401) {
    return "Session expired. Please sign in again.";
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.msg === "string") return obj.msg;
    if (obj.details) return `Validation: ${JSON.stringify(obj.details)}`;
    if (obj.message && typeof obj.message === "string") return obj.message;
  }
  return `Request failed with status ${status}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    handleUnauthorized();
    throw new AuthError();
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(formatApiError(response.status, data));
  }
  return response.json() as Promise<T>;
}

async function fetchFromNetwork<T>(path: string, auth: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    cache: "no-store",
  });
  return parseResponse<T>(response);
}

async function fetchAndStore<T>(path: string, auth: string, key: string, ttlMs: number): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const request = fetchFromNetwork<T>(path, auth)
    .then((data) => {
      if (ttlMs > 0) writeApiCache(key, data);
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}

function revalidateInBackground<T>(path: string, auth: string, key: string, ttlMs: number): void {
  if (inflight.has(key)) return;
  void fetchAndStore<T>(path, auth, key, ttlMs).catch(() => {
    /* keep stale data on background failure */
  });
}

export async function fetchWithAuth<T>(
  path: string,
  token?: string,
  options?: FetchWithAuthOptions
): Promise<T> {
  const auth = token ?? getStoredToken();
  const freshMs = options?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const staleMs = options?.cacheMaxMs ?? DEFAULT_CACHE_MAX_MS;
  const key = apiCacheKey(path, auth);

  if (freshMs > 0 && !options?.forceRefresh) {
    const entry = readApiCacheEntry(key);
    if (entry) {
      const age = Date.now() - entry.fetchedAt;
      if (age <= freshMs) {
        return entry.data as T;
      }
      if (age <= staleMs) {
        revalidateInBackground<T>(path, auth, key, freshMs);
        return entry.data as T;
      }
    }
  }

  return fetchAndStore<T>(path, auth, key, freshMs);
}

export async function fetchBlobWithAuth(path: string, token?: string): Promise<Blob> {
  const auth = token ?? getStoredToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    cache: "no-store",
  });
  if (response.status === 401) {
    handleUnauthorized();
    throw new AuthError();
  }
  if (!response.ok) {
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = await response.json().catch(() => ({}));
      throw new Error(formatApiError(response.status, data));
    }
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.blob();
}

export async function postWithAuth<T>(path: string, body: unknown, token?: string): Promise<T> {
  const auth = token ?? getStoredToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    handleUnauthorized();
    throw new AuthError();
  }
  if (!response.ok) {
    throw new Error(formatApiError(response.status, data));
  }
  invalidateAfterMutation(path);
  return data as T;
}

export async function deleteWithAuth<T>(path: string, token?: string): Promise<T> {
  const auth = token ?? getStoredToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: auth ? { Authorization: `Bearer ${auth}` } : {},
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    handleUnauthorized();
    throw new AuthError();
  }
  if (!response.ok) {
    throw new Error(formatApiError(response.status, data));
  }
  invalidateAfterMutation(path);
  return data as T;
}

export async function patchWithAuth<T>(path: string, body: unknown, token?: string): Promise<T> {
  const auth = token ?? getStoredToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    handleUnauthorized();
    throw new AuthError();
  }
  if (!response.ok) {
    throw new Error(formatApiError(response.status, data));
  }
  invalidateAfterMutation(path);
  return data as T;
}
