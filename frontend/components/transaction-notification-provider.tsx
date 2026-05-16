"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bell, BellOff, X } from "lucide-react";

import { AuthError, fetchWithAuth, getStoredToken } from "@/lib/api";
import { isSoundMuted, playTransactionAlert, setSoundMuted } from "@/lib/transaction-sound";
import type { TransactionRow } from "@/lib/types";

type ToastItem = {
  id: string;
  tx: TransactionRow;
  at: number;
};

type FeedResponse = {
  items: TransactionRow[];
  latest_id: number;
};

type TxNotifyContextValue = {
  muted: boolean;
  setMuted: (m: boolean) => void;
  acknowledgeThrough: (id: number) => void;
  notifyLocal: (tx: Partial<TransactionRow> & { id: number; amount: number }) => void;
};

const TxNotifyContext = createContext<TxNotifyContextValue | null>(null);

export function useTransactionNotifications() {
  const ctx = useContext(TxNotifyContext);
  if (!ctx) {
    throw new Error("useTransactionNotifications must be used within TransactionNotificationProvider");
  }
  return ctx;
}

function showBrowserNotification(tx: TransactionRow) {
  if (typeof window === "undefined" || !document.hidden) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const flagged = tx.status === "flagged" || tx.risk_score >= 60;
  try {
    new Notification(flagged ? "High-risk transaction" : "New transaction", {
      body: `TX #${tx.id} · $${tx.amount.toFixed(2)} · ${tx.merchant || tx.location} · risk ${tx.risk_score.toFixed(0)}`,
      tag: `tx-${tx.id}`,
    });
  } catch {
    /* ignore */
  }
}

export function TransactionNotificationProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMutedState] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastIdRef = useRef(0);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    setMutedState(isSoundMuted());
  }, []);

  const setMuted = useCallback((m: boolean) => {
    setSoundMuted(m);
    setMutedState(m);
  }, []);

  const pushToast = useCallback((tx: TransactionRow) => {
    setToasts((prev) => {
      const next = [{ id: `tx-${tx.id}-${Date.now()}`, tx, at: Date.now() }, ...prev];
      return next.slice(0, 6);
    });
  }, []);

  const handleNewTransactions = useCallback(
    async (items: TransactionRow[], playSound: boolean) => {
      if (!items.length) return;
      for (const tx of items) {
        if (tx.id > lastIdRef.current) {
          lastIdRef.current = tx.id;
        }
        pushToast(tx);
        showBrowserNotification(tx);
      }
      if (playSound) {
        await playTransactionAlert();
      }
    },
    [pushToast]
  );

  const notifyLocal = useCallback(
    (partial: Partial<TransactionRow> & { id: number; amount: number }) => {
      const tx: TransactionRow = {
        id: partial.id,
        user_id: partial.user_id ?? 0,
        amount: partial.amount,
        location: partial.location ?? "—",
        country: partial.country ?? null,
        merchant: partial.merchant ?? null,
        merchant_category: partial.merchant_category ?? null,
        card_last4: partial.card_last4 ?? null,
        card_type: partial.card_type ?? null,
        ip_address: partial.ip_address ?? null,
        device_id: partial.device_id ?? null,
        status: partial.status ?? "approved",
        risk_score: partial.risk_score ?? 0,
        confidence: partial.confidence ?? 0,
        created_at: partial.created_at ?? new Date().toISOString(),
      };
      if (tx.id > lastIdRef.current) {
        lastIdRef.current = tx.id;
      }
      void playTransactionAlert();
      pushToast(tx);
    },
    [pushToast]
  );

  const acknowledgeThrough = useCallback((id: number) => {
    if (id > lastIdRef.current) {
      lastIdRef.current = id;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    let cancelled = false;

    const poll = async () => {
      if (!getStoredToken()) return;
      try {
        const feed = await fetchWithAuth<FeedResponse>(
          `/transactions/feed?after_id=${lastIdRef.current}`,
          getStoredToken()
        );
        if (cancelled) return;

        if (!bootstrappedRef.current) {
          bootstrappedRef.current = true;
          if (feed.latest_id > lastIdRef.current) {
            lastIdRef.current = feed.latest_id;
          }
          return;
        }

        if (feed.items.length > 0) {
          await handleNewTransactions(feed.items, true);
        } else if (feed.latest_id > lastIdRef.current) {
          lastIdRef.current = feed.latest_id;
        }
      } catch (err) {
        if (err instanceof AuthError) {
          cancelled = true;
        }
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [handleNewTransactions]);

  useEffect(() => {
    const t = window.setInterval(() => {
      const cutoff = Date.now() - 8000;
      setToasts((prev) => prev.filter((x) => x.at > cutoff));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const ctxValue = useMemo(
    () => ({ muted, setMuted, acknowledgeThrough, notifyLocal }),
    [muted, setMuted, acknowledgeThrough, notifyLocal]
  );

  return (
    <TxNotifyContext.Provider value={ctxValue}>
      {children}
      <TransactionToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </TxNotifyContext.Provider>
  );
}

export function NotificationSoundToggle() {
  const { muted, setMuted } = useTransactionNotifications();
  return (
    <button
      type="button"
      onClick={() => {
        const next = !muted;
        setMuted(next);
        if (!next) void playTransactionAlert();
      }}
      className="rounded-lg border border-slate-200/90 bg-white/70 p-2 text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
      aria-label={muted ? "Unmute transaction alerts" : "Mute transaction alerts"}
      title={muted ? "Unmute alerts" : "Mute alerts"}
    >
      {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
    </button>
  );
}

function TransactionToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map(({ id, tx }) => {
        const high = tx.status === "flagged" || tx.risk_score >= 60;
        return (
          <div
            key={id}
            className={`pointer-events-auto animate-fade-up rounded-xl border p-3 shadow-lg backdrop-blur-md ${
              high
                ? "border-red-500/30 bg-red-950/90 text-red-50"
                : "border-cyan-500/25 bg-slate-900/95 text-slate-100"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {high ? "Risk alert" : "New transaction"}
              </p>
              <button
                type="button"
                onClick={() => onDismiss(id)}
                className="rounded p-0.5 opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-sm font-medium">
              TX #{tx.id} · ${tx.amount.toFixed(2)}
            </p>
            <p className="mt-0.5 text-xs opacity-80">
              {tx.merchant || "Merchant"} · {tx.location} · score {tx.risk_score.toFixed(0)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

