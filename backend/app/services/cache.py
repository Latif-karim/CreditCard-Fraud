"""Simple in-process TTL cache for read-heavy API responses."""

from __future__ import annotations

import threading
import time
from typing import Any, Callable

_lock = threading.Lock()
_store: dict[str, tuple[Any, float]] = {}


def cache_get(key: str) -> Any | None:
    now = time.monotonic()
    with _lock:
        entry = _store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if expires_at <= now:
            del _store[key]
            return None
        return value


def cache_set(key: str, value: Any, ttl_seconds: float) -> None:
    expires_at = time.monotonic() + max(ttl_seconds, 0.0)
    with _lock:
        _store[key] = (value, expires_at)


def cache_delete(key: str) -> None:
    with _lock:
        _store.pop(key, None)


def cache_invalidate_prefix(prefix: str) -> None:
    with _lock:
        keys = [k for k in _store if k.startswith(prefix)]
        for key in keys:
            del _store[key]


def cache_clear() -> None:
    with _lock:
        _store.clear()


def get_or_set(key: str, ttl_seconds: float, builder: Callable[[], Any]) -> Any:
    cached = cache_get(key)
    if cached is not None:
        return cached
    value = builder()
    cache_set(key, value, ttl_seconds)
    return value


def scoped_key(*parts: object) -> str:
    return ":".join(str(p) for p in parts if p is not None)


def invalidate_dashboard_cache() -> None:
    cache_invalidate_prefix("dashboard:")


def invalidate_alerts_cache(user_id: int | None = None) -> None:
    if user_id is None:
        cache_invalidate_prefix("alerts:")
    else:
        cache_invalidate_prefix(f"alerts:{user_id}:")


def invalidate_read_caches(user_id: int | None = None) -> None:
    invalidate_dashboard_cache()
    invalidate_alerts_cache(user_id)
    cache_invalidate_prefix("transactions:")
