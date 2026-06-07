type CacheEntry = {
  data: unknown;
  fetchedAt: number;
};

const STORAGE_PREFIX = "fd-api:";
const store = new Map<string, CacheEntry>();

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function readStorageEntry(key: string): CacheEntry | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeStorageEntry(key: string, entry: CacheEntry): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    /* quota or private mode */
  }
}

function deleteStorageEntry(key: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(key));
  } catch {
    /* ignore */
  }
}

function readEntry(key: string): CacheEntry | null {
  const mem = store.get(key);
  if (mem) return mem;
  const stored = readStorageEntry(key);
  if (stored) {
    store.set(key, stored);
    return stored;
  }
  return null;
}

function writeEntry(key: string, entry: CacheEntry): void {
  store.set(key, entry);
  writeStorageEntry(key, entry);
}

export function apiCacheKey(path: string, token: string): string {
  const tokenPart = token ? token.slice(-16) : "anon";
  return `${path}::${tokenPart}`;
}

/** Return cached payload if present and younger than maxAgeMs (default: any age). */
export function peekApiCache<T>(path: string, token: string, maxAgeMs = Number.POSITIVE_INFINITY): T | null {
  const entry = readEntry(apiCacheKey(path, token));
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > maxAgeMs) return null;
  return entry.data as T;
}

export function readApiCacheEntry(key: string): CacheEntry | null {
  return readEntry(key);
}

export function writeApiCache(key: string, data: unknown): void {
  writeEntry(key, { data, fetchedAt: Date.now() });
}

export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    if (typeof sessionStorage !== "undefined") {
      try {
        const keys: string[] = [];
        for (let i = 0; i < sessionStorage.length; i += 1) {
          const k = sessionStorage.key(i);
          if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
        }
        keys.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        /* ignore */
      }
    }
    return;
  }

  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      deleteStorageEntry(key);
    }
  }

  if (typeof sessionStorage !== "undefined") {
    try {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i += 1) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(STORAGE_PREFIX) && k.slice(STORAGE_PREFIX.length).startsWith(prefix)) {
          keys.push(k);
        }
      }
      keys.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }
}

/** Drop cached reads after a write without clearing unrelated auth state. */
export function invalidateAfterMutation(path: string): void {
  if (path.startsWith("/auth")) {
    invalidateApiCache();
    return;
  }
  if (path.includes("/notifications")) {
    invalidateApiCache("/alerts/notifications");
    return;
  }
  invalidateApiCache("/dashboard");
  invalidateApiCache("/alerts");
  invalidateApiCache("/transactions");
  invalidateApiCache("/admin");
}

export function hasApiCache(path: string, token: string, maxAgeMs = Number.POSITIVE_INFINITY): boolean {
  return peekApiCache(path, token, maxAgeMs) !== null;
}
