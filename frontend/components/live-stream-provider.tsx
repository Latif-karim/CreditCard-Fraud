"use client";

import { useEffect, useRef } from "react";

import { getApiBase, getStoredToken, handleUnauthorized } from "@/lib/api";
import { dispatchLiveEvent, type LiveStreamEvent } from "@/lib/live-updates";
import type { TransactionRow } from "@/lib/types";

const RECONNECT_MS = 4000;

/** One persistent SSE connection — server pushes only when data changes. */
export function useLiveStreamConnection(enabled = true): void {
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let cancelled = false;

    const catchUp = async () => {
      const token = getStoredToken();
      if (!token || lastIdRef.current <= 0) return;
      try {
        const res = await fetch(
          `${getApiBase()}/transactions/feed?after_id=${lastIdRef.current}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: TransactionRow[]; latest_id: number };
        for (const tx of data.items ?? []) {
          lastIdRef.current = Math.max(lastIdRef.current, tx.id);
          dispatchLiveEvent({ type: "transaction.created", transaction: tx });
        }
        if (data.latest_id > lastIdRef.current) {
          lastIdRef.current = data.latest_id;
        }
      } catch {
        /* offline — stream will retry */
      }
    };

    const connect = () => {
      if (cancelled) return;
      const token = getStoredToken();
      if (!token) return;

      sourceRef.current?.close();
      const url = `${getApiBase()}/transactions/stream?token=${encodeURIComponent(token)}`;
      const source = new EventSource(url);
      sourceRef.current = source;

      source.addEventListener("connected", () => {
        void catchUp();
      });

      source.addEventListener("live", (ev) => {
        try {
          const parsed = JSON.parse((ev as MessageEvent).data) as LiveStreamEvent;
          if (parsed.type === "transaction.created" || parsed.type === "transaction.updated") {
            lastIdRef.current = Math.max(lastIdRef.current, parsed.transaction.id);
          }
          dispatchLiveEvent(parsed);
        } catch {
          /* ignore malformed */
        }
      });

      source.onerror = () => {
        source.close();
        if (cancelled) return;
        if (source.readyState === EventSource.CLOSED) {
          fetch(`${getApiBase()}/auth/me`, {
            headers: { Authorization: `Bearer ${getStoredToken()}` },
          })
            .then((r) => {
              if (r.status === 401) handleUnauthorized();
            })
            .catch(() => {});
        }
        reconnectRef.current = setTimeout(connect, RECONNECT_MS);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [enabled]);
}
