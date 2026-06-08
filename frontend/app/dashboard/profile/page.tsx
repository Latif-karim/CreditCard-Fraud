"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Smartphone, UserCog } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ProfileSkeleton } from "@/components/skeletons";
import { fetchWithAuth, patchWithAuth, postWithAuth } from "@/lib/api";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type AppRole } from "@/lib/roles";

type Me = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  stored_role?: string;
  requested_role?: string | null;
  approved?: boolean;
  email_verified: boolean;
  two_factor_enabled: boolean;
};

type Session = {
  id: number;
  device_label: string;
  ip_address: string | null;
  last_seen: string;
  is_current: boolean;
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [cur, setCur] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestRole, setRequestRole] = useState<"analyst" | "admin">("analyst");
  const [requestNote, setRequestNote] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);

  const profileDirty = name.trim() !== savedName.trim();
  const pendingRole = me?.requested_role;
  const hasElevatedAccess =
    (me?.stored_role === "analyst" || me?.stored_role === "admin" || me?.role === "analyst" || me?.role === "admin") &&
    me?.approved !== false &&
    !pendingRole;

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token") || "";
    setLoading(true);
    try {
      const [m, s] = await Promise.all([
        fetchWithAuth<Me>("/users/me", token).catch(() => null),
        fetchWithAuth<Session[]>("/users/sessions", token).catch(() => [] as Session[]),
      ]);
      if (m) {
        setMe(m);
        const loaded = m.full_name || "";
        setName(loaded);
        setSavedName(loaded);
        if (m.requested_role === "admin" || m.requested_role === "analyst") {
          setRequestRole(m.requested_role);
        }
      } else {
        setMe(null);
      }
      setSessions(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveProfile = async () => {
    if (!profileDirty || saving) return;
    const token = localStorage.getItem("access_token") || "";
    setSaving(true);
    setMsg("");
    try {
      await patchWithAuth("/users/me", { full_name: name.trim() }, token);
      const trimmed = name.trim();
      setSavedName(trimmed);
      setName(trimmed);
      setMe((m) => (m ? { ...m, full_name: trimmed || null } : m));
      setMsg("Profile saved");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const changePw = async () => {
    const token = localStorage.getItem("access_token") || "";
    try {
      await postWithAuth("/users/change-password", { current_password: cur, new_password: newPw }, token);
      setMsg("Password updated");
      setCur("");
      setNewPw("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const toggle2fa = async () => {
    const token = localStorage.getItem("access_token") || "";
    const res = await postWithAuth<{ two_factor_enabled: boolean }>("/users/toggle-2fa", {}, token);
    setMe((m) => (m ? { ...m, two_factor_enabled: res.two_factor_enabled } : m));
    setMsg("Two-factor authentication updated.");
  };

  const submitRoleRequest = async () => {
    const token = localStorage.getItem("access_token") || "";
    setRequestBusy(true);
    setMsg("");
    try {
      const res = await postWithAuth<{ message: string; requested_role: string }>(
        "/users/me/request-role",
        { role: requestRole, note: requestNote.trim() || undefined },
        token
      );
      setMsg(res.message);
      await loadProfile();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setRequestBusy(false);
    }
  };

  const cancelRoleRequest = async () => {
    const token = localStorage.getItem("access_token") || "";
    setRequestBusy(true);
    setMsg("");
    try {
      const res = await postWithAuth<{ message: string }>("/users/me/cancel-role-request", {}, token);
      setMsg(res.message);
      await loadProfile();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setRequestBusy(false);
    }
  };

  return (
    <AppShell title="Profile & security" subtitle="Account hardening">
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass-card space-y-3 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Identity
              </h3>
              {me ? (
                <p className="text-soft text-xs">
                  {me.email} · {ROLE_LABELS[me.role as AppRole] ?? me.role} · email verified:{" "}
                  {me.email_verified ? "yes" : "no"}
                </p>
              ) : null}
              <label className="text-soft text-xs">Display name</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (msg === "Profile saved") setMsg("");
                }}
              />
              {profileDirty ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveProfile()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile up to date</p>
              )}
            </div>

            <div className="glass-card space-y-3 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <UserCog className="h-4 w-4" />
                Workspace access
              </h3>
              {hasElevatedAccess ? (
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  You have <strong>{ROLE_LABELS[me!.role as AppRole] ?? me!.role}</strong> access.{" "}
                  {ROLE_DESCRIPTIONS[me!.role as AppRole]}
                </p>
              ) : pendingRole ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    <p className="font-medium">Pending {ROLE_LABELS[pendingRole as AppRole] ?? pendingRole} request</p>
                    <p className="mt-1 text-xs opacity-90">
                      An administrator must approve your request. Until then, you keep cardholder permissions in this
                      session. Sign out and back in after approval to unlock the new workspace.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={requestBusy}
                    onClick={() => void cancelRoleRequest()}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700"
                  >
                    Cancel request
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-soft text-xs">
                    Cardholders can request analyst or administrator access. An admin will review your request before
                    elevated permissions are granted.
                  </p>
                  <label className="text-soft text-xs">Requested role</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    value={requestRole}
                    onChange={(e) => setRequestRole(e.target.value as "analyst" | "admin")}
                  >
                    <option value="analyst">Fraud Analyst</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <p className="text-soft text-xs">{ROLE_DESCRIPTIONS[requestRole]}</p>
                  <label className="text-soft text-xs">Note for administrator (optional)</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Brief reason for access, e.g. final-year project demo role…"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={requestBusy}
                    onClick={() => void submitRoleRequest()}
                    className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-sky-600"
                  >
                    {requestBusy ? "Submitting…" : "Submit access request"}
                  </button>
                </div>
              )}
            </div>

            <div className="glass-card space-y-3 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="h-4 w-4" />
                Password
              </h3>
              <input
                type="password"
                placeholder="Current password"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={cur}
                onChange={(e) => setCur(e.target.value)}
              />
              <input
                type="password"
                placeholder="New password (8+ chars)"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void changePw()}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700"
              >
                Update password
              </button>
              <button
                type="button"
                onClick={() => void toggle2fa()}
                className="ml-2 text-sm text-sky-700 underline dark:text-sky-400"
              >
                Toggle two-factor authentication
              </button>
            </div>

            <div className="glass-card space-y-3 p-4 lg:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Smartphone className="h-4 w-4" />
                Sessions & devices
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {sessions.map((s) => (
                  <div key={s.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <p className="font-medium">{s.device_label}</p>
                    <p className="text-soft text-xs">
                      {s.ip_address} · {new Date(s.last_seen).toLocaleString()}
                    </p>
                    {s.is_current ? (
                      <span className="mt-1 inline-block text-xs text-emerald-600">Current session</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {msg ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{msg}</p> : null}
        </>
      )}
    </AppShell>
  );
}
