"use client";

import { useCallback, useEffect, useState } from "react";
import { Cpu, Database, ShieldCheck, Trash2, Users, XCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { ListSkeleton, TableSkeleton } from "@/components/skeletons";
import { deleteWithAuth, fetchWithAuth, patchWithAuth, postWithAuth } from "@/lib/api";
import type {
  AdminSystemStats,
  AdminTransactionRow,
  AdminTransactionsPage,
  AdminUser,
  FraudRule,
} from "@/lib/types";

const PURGE_PHRASE = "DELETE_ALL_TRANSACTIONS";

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [stats, setStats] = useState<AdminSystemStats | null>(null);
  const [selfId, setSelfId] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [txData, setTxData] = useState<AdminTransactionsPage | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [deleteTxId, setDeleteTxId] = useState("");

  const token = () => localStorage.getItem("access_token") || "";

  const loadTransactions = useCallback(async (page = 1) => {
    const res = await fetchWithAuth<AdminTransactionsPage>(
      `/admin/transactions?page=${page}&per_page=25`,
      token()
    );
    setTxData(res);
    setTxPage(page);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [u, r, s, me] = await Promise.all([
        fetchWithAuth<AdminUser[]>("/admin/users", token()),
        fetchWithAuth<FraudRule[]>("/dashboard/rules", token()),
        fetchWithAuth<AdminSystemStats>("/admin/system/stats", token()),
        fetchWithAuth<{ id: number }>("/auth/me", token()),
      ]);
      setUsers(u);
      setRules(r);
      setStats(s);
      setSelfId(me.id);
      await loadTransactions(1);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  const pendingRequests = users.filter((u) => (u.role === "analyst" || u.role === "admin") && !u.approved);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!ok) return;
    const t = window.setTimeout(() => setOk(""), 5000);
    return () => window.clearTimeout(t);
  }, [ok]);

  const patchUser = async (id: number, body: Record<string, unknown>) => {
    setErr("");
    setOk("");
    try {
      await patchWithAuth(`/admin/users/${id}`, body, token());
      await loadAll();
      setOk("User updated.");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const deleteUser = async (u: AdminUser) => {
    if (selfId === u.id) {
      setErr("You cannot delete your own account.");
      return;
    }
    const msg =
      u.role === "admin"
        ? `Permanently delete admin ${u.email} and all their data?`
        : `Permanently delete ${u.email} and all their transactions?`;
    if (!window.confirm(msg)) return;

    setBusy(`user-${u.id}`);
    setErr("");
    setOk("");
    try {
      const res = await deleteWithAuth<{ message: string; transactions_removed: number }>(
        `/admin/users/${u.id}`,
        token()
      );
      await loadAll();
      setOk(`${res.message} (${res.transactions_removed} transactions removed).`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const reviewAccess = async (u: AdminUser, decision: "approve" | "reject") => {
    const label = decision === "approve" ? "approve" : "reject";
    const actionLabel = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
    if (!window.confirm(`${actionLabel} ${u.role} access for ${u.email}?`)) {
      return;
    }

    setBusy(`review-${u.id}`);
    setErr("");
    setOk("");
    try {
      const res = await postWithAuth<{ message: string }>(
        `/admin/users/${u.id}/${decision}`,
        {},
        token()
      );
      await loadAll();
      setOk(res.message);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const deleteTransaction = async (id: number) => {
    if (!window.confirm(`Permanently delete transaction #${id}?`)) return;
    setBusy(`tx-${id}`);
    setErr("");
    setOk("");
    try {
      await deleteWithAuth<{ message: string }>(`/admin/transactions/${id}`, token());
      setDeleteTxId("");
      await loadTransactions(txPage);
      const s = await fetchWithAuth<AdminSystemStats>("/admin/system/stats", token());
      setStats(s);
      setOk(`Transaction #${id} deleted.`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const purgeTransactions = async () => {
    if (purgeConfirm.trim() !== PURGE_PHRASE) {
      setErr(`Type ${PURGE_PHRASE} to confirm.`);
      return;
    }
    if (
      !window.confirm(
        "This permanently deletes ALL transactions, fraud decisions, alerts, and notifications. User accounts are kept. Continue?"
      )
    ) {
      return;
    }

    setBusy("purge");
    setErr("");
    setOk("");
    try {
      const res = await postWithAuth<{
        message: string;
        transactions_removed: number;
      }>("/admin/data/purge-transactions", { confirm: PURGE_PHRASE }, token());
      setPurgeConfirm("");
      await loadAll();
      setOk(`${res.message} (${res.transactions_removed} transactions removed).`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const toggleRule = async (id: number, enabled: boolean) => {
    try {
      await patchWithAuth(`/admin/rules/${id}`, { enabled }, token());
      const r = await fetchWithAuth<FraudRule[]>("/dashboard/rules", token());
      setRules(r);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const retrain = async () => {
    try {
      await postWithAuth("/admin/models/retrain", {}, token());
      setOk("Retrain job queued.");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <RoleGuard allow={["admin"]} title="Administration">
      <AppShell title="Administration" subtitle="Users, rules, and platform maintenance">
        {loading ? (
          <div className="space-y-4">
            <TableSkeleton rows={5} cols={5} />
            <ListSkeleton items={4} />
          </div>
        ) : (
          <>
            {err ? (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {err}
              </p>
            ) : null}
            {ok ? (
              <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                {ok}
              </p>
            ) : null}

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void retrain()}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-slate-900"
              >
                <Cpu className="h-4 w-4" />
                Queue model retrain
              </button>
            </div>

            <div className="glass-card mb-4 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Pending requests
              </h3>
              <p className="text-soft mb-3 text-xs">
                Analyst and admin registrations stay locked until an existing administrator reviews them.
              </p>
              {pendingRequests.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-soft text-left">
                        <th className="pb-2 pr-3">Name</th>
                        <th className="pb-2 pr-3">Email</th>
                        <th className="pb-2 pr-3">Requested access</th>
                        <th className="pb-2">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((u) => (
                        <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="py-2 pr-3">{u.full_name || "Not provided"}</td>
                          <td className="py-2 pr-3">{u.email}</td>
                          <td className="py-2 pr-3 capitalize">{u.role}</td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={busy !== null}
                                onClick={() => void reviewAccess(u, "approve")}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                {busy === `review-${u.id}` ? "…" : "Approve"}
                              </button>
                              <button
                                type="button"
                                disabled={busy !== null}
                                onClick={() => void reviewAccess(u, "reject")}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                              >
                                <XCircle className="h-3 w-3" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-lg border border-slate-200 bg-white/60 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                  No pending access requests.
                </p>
              )}
            </div>

            <div className="glass-card mb-4 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Database className="h-4 w-4" />
                Data maintenance
              </h3>
              {stats ? (
                <div className="mb-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {(
                    [
                      ["Users", stats.users],
                      ["Transactions", stats.transactions],
                      ["Decisions", stats.fraud_decisions],
                      ["Disputes", stats.disputes],
                      ["Alerts", stats.alerts],
                      ["Notifications", stats.notifications],
                      ["Audit logs", stats.audit_logs],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-slate-200 bg-white/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <p className="text-soft text-[10px] uppercase tracking-wide">{label}</p>
                      <p className="text-lg font-semibold">{value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="text-soft mb-3 text-xs leading-relaxed">
                Remove all transaction history, fraud scores, alerts, and in-app notifications. User accounts,
                fraud rules, and audit logs are preserved.
              </p>
              <label className="text-soft block text-xs">
                Type <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{PURGE_PHRASE}</code> to
                enable
              </label>
              <input
                className="input-fintech mt-1 max-w-md"
                value={purgeConfirm}
                onChange={(e) => setPurgeConfirm(e.target.value)}
                placeholder={PURGE_PHRASE}
                autoComplete="off"
              />
              <button
                type="button"
                disabled={busy !== null || purgeConfirm.trim() !== PURGE_PHRASE}
                onClick={() => void purgeTransactions()}
                className="btn-fintech-secondary mt-3 inline-flex items-center gap-2 border-red-300 text-red-800 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" />
                {busy === "purge" ? "Removing…" : "Remove all transaction data"}
              </button>
            </div>

            <div className="glass-card mb-4 flex max-h-[min(28rem,50vh)] flex-col p-4">
              <h3 className="mb-2 flex shrink-0 items-center gap-2 text-sm font-semibold">
                <Trash2 className="h-4 w-4" />
                Remove transactions
              </h3>
              <p className="text-soft mb-3 shrink-0 text-xs">
                Delete individual records here. Analyst pages cannot remove transactions — use this console
                only.
              </p>
              <div className="mb-3 flex shrink-0 flex-wrap items-end gap-2">
                <label className="text-soft block text-xs">
                  Delete by ID
                  <input
                    className="input-fintech mt-1 w-32"
                    value={deleteTxId}
                    onChange={(e) => setDeleteTxId(e.target.value)}
                    placeholder="e.g. 42"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy !== null || !deleteTxId.trim()}
                  onClick={() => void deleteTransaction(Number(deleteTxId))}
                  className="btn-fintech-secondary text-red-800 dark:text-red-300"
                >
                  Delete
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain pr-1">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="sticky top-0 bg-white/95 dark:bg-slate-950/95">
                    <tr className="text-soft text-left">
                      <th className="pb-2 pr-3">ID</th>
                      <th className="pb-2 pr-3">User</th>
                      <th className="pb-2 pr-3">Amount</th>
                      <th className="pb-2 pr-3">Location</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2 pr-3">Risk</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(txData?.items ?? []).map((tx: AdminTransactionRow) => (
                      <tr key={tx.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-3 font-mono text-xs">#{tx.id}</td>
                        <td className="py-2 pr-3">{tx.user_id}</td>
                        <td className="py-2 pr-3">${tx.amount.toFixed(2)}</td>
                        <td className="py-2 pr-3">{tx.location}</td>
                        <td className="py-2 pr-3 capitalize">{tx.status}</td>
                        <td className="py-2 pr-3">{tx.risk_score.toFixed(1)}</td>
                        <td className="py-2">
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => void deleteTransaction(tx.id)}
                            className="text-xs font-medium text-red-700 underline hover:no-underline disabled:opacity-40 dark:text-red-400"
                          >
                            {busy === `tx-${tx.id}` ? "…" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!txData?.items.length ? (
                  <p className="text-soft py-4 text-sm">No transactions in the database.</p>
                ) : null}
              </div>
              {txData && txData.pages > 1 ? (
                <div className="mt-3 flex shrink-0 items-center justify-between text-xs">
                  <span className="text-soft">
                    Page {txData.page} / {txData.pages} · {txData.total} total
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={txPage <= 1 || busy !== null}
                      className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
                      onClick={() => void loadTransactions(txPage - 1)}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={txPage >= txData.pages || busy !== null}
                      className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
                      onClick={() => void loadTransactions(txPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="glass-card mb-4 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4" />
                Users
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-soft text-left">
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Active</th>
                      <th className="pb-2">Approval</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = selfId === u.id;
                      return (
                        <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="py-2">
                            {u.email}
                            {isSelf ? (
                              <span className="text-soft ml-1 text-[10px]">(you)</span>
                            ) : null}
                          </td>
                          <td className="py-2">
                            <select
                              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                              value={u.role}
                              disabled={busy !== null}
                              onChange={(e) => void patchUser(u.id, { role: e.target.value })}
                            >
                              <option value="user">user</option>
                              <option value="analyst">analyst</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="py-2">{u.is_active ? "Yes" : "No"}</td>
                          <td className="py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                u.approved
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {u.approved ? "Approved" : "Pending"}
                            </span>
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={busy !== null}
                                className="text-xs text-sky-700 underline dark:text-sky-400"
                                onClick={() => void patchUser(u.id, { is_active: !u.is_active })}
                              >
                                {u.is_active ? "Suspend" : "Activate"}
                              </button>
                              <button
                                type="button"
                                disabled={busy !== null || isSelf}
                                title={isSelf ? "Cannot delete your own account" : "Delete user permanently"}
                                onClick={() => void deleteUser(u)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
                              >
                                <Trash2 className="h-3 w-3" />
                                {busy === `user-${u.id}` ? "…" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="mb-2 text-sm font-semibold">Fraud rules</h3>
              <ul className="space-y-2 text-sm">
                {rules.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-soft text-xs">{r.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleRule(r.id, !r.enabled)}
                      className={`rounded px-2 py-1 text-xs ${r.enabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800"}`}
                    >
                      {r.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </AppShell>
    </RoleGuard>
  );
}
