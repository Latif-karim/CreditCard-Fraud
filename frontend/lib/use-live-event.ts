"use client";

import { useEffect } from "react";

import { LIVE_STREAM_EVENT, type LiveStreamEvent } from "@/lib/live-updates";

/** Subscribe to push events from the SSE live stream (no polling). */
export function useLiveEvent(handler: (event: LiveStreamEvent) => void, enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const listener = (e: Event) => {
      const detail = (e as CustomEvent<LiveStreamEvent>).detail;
      if (detail) handler(detail);
    };

    window.addEventListener(LIVE_STREAM_EVENT, listener);
    return () => window.removeEventListener(LIVE_STREAM_EVENT, listener);
  }, [handler, enabled]);
}
