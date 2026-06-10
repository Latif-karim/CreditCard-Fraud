"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, Database, Play, Square, Zap } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { FormPanelSkeleton, Skeleton } from "@/components/skeletons";
import { useTransactionNotifications } from "@/components/transaction-notification-provider";
import { getClientUserId, setClientSession } from "@/lib/auth-session";
import { fetchWithAuth, getStoredToken, postWithAuth } from "@/lib/api";

type SimulatorStatus = {
  running: boolean;
  interval_seconds: number;
  ticks: number;
  last_tick_at: string | null;
  last_error: string | null;
};

type IngestResult = {
  transaction_id: number;
  risk_score?: number;
  label?: string;
  status: string;
  confidence?: number;
  reasons?: string[];
  customer_status?: string;
  message?: string;
  amount?: number;
  location?: string;
};

type MeResponse = { id: number; email: string; role: string };

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="icon-chip">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
  );
}

export default function CapturePage() {
  const { notifyLocal } = useTransactionNotifications();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState("analyst");
  const [userId, setUserId] = useState("1");
  const [amount, setAmount] = useState("125.50");
  const [location, setLocation] = useState("London");
  const [country, setCountry] = useState("UK");
  const [merchant, setMerchant] = useState("Amazon");
  const [merchantCategory, setMerchantCategory] = useState("ecommerce");
  const [cardLast4, setCardLast4] = useState("4242");
  const [cardType, setCardType] = useState("visa");
  const [autoStream, setAutoStream] = useState(false);
  const [sim, setSim] = useState<SimulatorStatus | null>(null);
  const [lastResult, setLastResult] = useState<IngestResult | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamBusy, setStreamBusy] = useState(false);

  const initSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setMsg("Not signed in. Please log in again.");
      setReady(true);
      return;
    }
    const uid = getClientUserId();
    if (uid) setUserId(String(uid));
    setRole(localStorage.getItem("role") || "analyst");
    setReady(true);

    try {
      const me = await fetchWithAuth<MeResponse>("/auth/me", token);
      setRole(me.role);
      setUserId(String(me.id));
      setClientSession(token, me.role, me.id);
    } catch {
      /* keep cached role/user from storage */
    }
  }, []);

  const refreshSim = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const s = await fetchWithAuth<SimulatorStatus>("/transactions/simulator/status", token);
      setSim(s);
      setAutoStream(s.running);
    } catch (e) {
      setSim(null);
    }
  }, []);

  useEffect(() => {
    void initSession().then(() => refreshSim());
  }, [initSession, refreshSim]);

  const submitManual = async (e: FormEvent) => {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) {
      setMsg("Session expired. Log in again.");
      return;
    }
    setBusy(true);
    setMsg("Scoring transaction… cloud scoring can take 15–30 seconds.");
    try {
      const body: Record<string, unknown> = {
        amount: Number(amount),
        location: location.trim(),
        country: country.trim(),
        merchant: merchant.trim(),
        merchant_category: merchantCategory.trim(),
        card_last4: cardLast4.trim(),
        card_type: cardType,
        ip_address: "203.0.113.10",
        device_id: "manual-entry",
      };
      body.user_id = Number(userId);
      const res = await postWithAuth<IngestResult>("/transactions/ingest", body, token);
      setLastResult(res);
      notifyLocal({
        id: res.transaction_id,
        amount: Number(amount),
        location,
        merchant,
        country,
        status: res.status,
        risk_score: res.risk_score ?? 0,
        confidence: res.confidence ?? 0,
      });
      setMsg(
        `Transaction #${res.transaction_id} · risk ${(res.risk_score ?? 0).toFixed(1)} · DL hybrid ${((res.confidence ?? 0) * 100).toFixed(1)}% · ${res.status}`
      );
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleStream = async () => {
    const token = getStoredToken();
    if (!token) {
      setMsg("Session expired. Log in again.");
      return;
    }
    setStreamBusy(true);
    setMsg("");
    try {
      if (autoStream) {
        await postWithAuth("/transactions/simulator/stop", {}, token);
        setAutoStream(false);
        setMsg("Stream stopped.");
      } else {
        const status = await postWithAuth<SimulatorStatus>(
          "/transactions/simulator/start",
          { interval_seconds: 30 },
          token
        );
        setSim(status);
        setAutoStream(true);
        setMsg("Continuous monitoring started. New transactions will be scored automatically.");
      }
      await refreshSim();
    } catch (err) {
      setMsg((err as Error).message);
      await refreshSim();
    } finally {
      setStreamBusy(false);
    }
  };

  const tickNow = async () => {
    const token = getStoredToken();
    if (!token) {
      setMsg("Session expired. Log in again.");
      return;
    }
    setStreamBusy(true);
    setMsg("Processing transaction… cloud scoring can take 15–30 seconds.");
    try {
      const res = await postWithAuth<IngestResult>("/transactions/simulator/tick", {}, token);
      setLastResult(res);
      notifyLocal({
        id: res.transaction_id,
        amount: res.amount ?? Number(amount),
        location: res.location ?? location,
        status: res.status,
        risk_score: res.risk_score ?? 0,
        confidence: res.confidence ?? 0,
      });
      setMsg(
        `Transaction #${res.transaction_id} processed · risk ${(res.risk_score ?? 0).toFixed(1)} · ML ${((res.confidence ?? 0) * 100).toFixed(1)}%`
      );
      await refreshSim();
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setStreamBusy(false);
    }
  };

  const canPickUser = role === "admin" || role === "analyst";

  if (!ready) {
    return (
      <AppShell title="Transactions" subtitle="Submit and monitor card activity">
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="col-span-full h-24 w-full rounded-2xl lg:col-span-2" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <FormPanelSkeleton />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Transactions" subtitle="Submit and monitor card activity">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="fintech-panel col-span-full p-5 lg:col-span-2">
          <SectionTitle icon={Database} title="Transaction intake" />
          <p className="text-soft mt-3 text-sm leading-relaxed">
            Submit individual payments for real-time scoring, or enable continuous monitoring to process incoming
            card activity as it arrives.
          </p>
        </div>

        {canPickUser ? (
        <div className="fintech-panel p-5">
          <SectionTitle icon={Activity} title="Continuous monitoring" />
          <p className="text-soft mt-2 text-xs">
            {sim?.running
              ? `Active · ${sim.ticks} transactions processed · last event ${sim.last_tick_at ?? "—"}`
              : "Inactive — start monitoring to score new transactions automatically"}
          </p>
          {sim?.last_error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{sim.last_error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={streamBusy}
              onClick={() => void toggleStream()}
              className="btn-fintech-secondary flex-1 disabled:opacity-60"
            >
              {autoStream ? <Square className="mr-2 inline h-4 w-4" /> : <Play className="mr-2 inline h-4 w-4" />}
              {streamBusy ? "…" : autoStream ? "Stop monitoring" : "Start monitoring"}
            </button>
            <button
              type="button"
              disabled={streamBusy}
              onClick={() => void tickNow()}
              className="btn-fintech-primary flex-1 disabled:opacity-60"
            >
              <Zap className="mr-2 inline h-4 w-4" />
              Process now
            </button>
          </div>
        </div>
        ) : (
          <div className="fintech-panel p-5 text-sm text-slate-600 dark:text-slate-300">
            <SectionTitle icon={Activity} title="Continuous monitoring" />
            <p className="text-soft mt-2 text-xs leading-relaxed">
              Automated transaction monitoring is available to analysts and administrators. Submit your own payments
              using the form below.
            </p>
          </div>
        )}

        <form onSubmit={submitManual} className="fintech-panel col-span-full space-y-4 p-5 lg:col-span-2">
          <SectionTitle icon={Zap} title="Submit transaction" />
          <div className="grid gap-3 sm:grid-cols-2">
            {canPickUser ? (
              <label className="block text-sm">
                <span className="text-soft text-xs">User ID</span>
                <input className="input-fintech mt-1" value={userId} onChange={(e) => setUserId(e.target.value)} required />
              </label>
            ) : (
              <div className="text-soft text-sm sm:col-span-2">
                Transactions will be recorded for your account (user #{userId}).
              </div>
            )}
            <label className="block text-sm">
              <span className="text-soft text-xs">Amount (USD)</span>
              <input
                className="input-fintech mt-1"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-soft text-xs">Location</span>
              <input className="input-fintech mt-1" required value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-soft text-xs">Country</span>
              <input className="input-fintech mt-1" value={country} onChange={(e) => setCountry(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-soft text-xs">Merchant</span>
              <input className="input-fintech mt-1" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-soft text-xs">Category</span>
              <input
                className="input-fintech mt-1"
                value={merchantCategory}
                onChange={(e) => setMerchantCategory(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-soft text-xs">Card last 4</span>
              <input className="input-fintech mt-1" maxLength={4} value={cardLast4} onChange={(e) => setCardLast4(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-soft text-xs">Card type</span>
              <select className="input-fintech mt-1" value={cardType} onChange={(e) => setCardType(e.target.value)}>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">Amex</option>
                <option value="discover">Discover</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={busy} className="btn-fintech-primary w-full disabled:opacity-60">
            {busy ? "Scoring…" : "Submit & score transaction"}
          </button>
          {msg ? <p className="text-sm text-slate-600 dark:text-slate-300">{msg}</p> : null}
          {lastResult ? (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm dark:border-cyan-400/20">
              <p className="font-medium text-slate-900 dark:text-white">
                TX #{lastResult.transaction_id}
                {` · ${lastResult.label}`}
                {" · score "}
                {(lastResult.risk_score ?? 0).toFixed(1)}
                {" · DL hybrid "}
                {((lastResult.confidence ?? 0) * 100).toFixed(1)}%
              </p>
              <ul className="text-soft mt-2 list-disc pl-5 text-xs">
                {(lastResult.reasons || []).slice(0, 4).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </form>
      </div>
    </AppShell>
  );
}

