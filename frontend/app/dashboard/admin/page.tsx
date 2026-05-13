"use client";

import { useEffect, useState } from "react";
import { Cpu, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { fetchWithAuth, patchWithAuth, postWithAuth } from "@/lib/api";
import type { AdminUser, FraudRule } from "@/lib/types";

export default function AdminPage() {
  const [role, setRole] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    if (role !== "admin") return;
    fetchWithAuth<AdminUser[]>("/admin/users", token)
      .then(setUsers)
      .catch(() => setUsers([]));
    fetchWithAuth<FraudRule[]>("/dashboard/rules", token)
      .then(setRules)
      .catch(() => setRules([]));
  }, [role]);

  const patchUser = async (id: number, body: Record<string, unknown>) => {
    setErr("");
    const token = localStorage.getItem("access_token") || "";
    try {
      await patchWithAuth(`/admin/users/${id}`, body, token);
      const list = await fetchWithAuth<AdminUser[]>("/admin/users", token);
      setUsers(list);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const toggleRule = async (id: number, enabled: boolean) => {
    const token = localStorage.getItem("access_token") || "";
    await patchWithAuth(`/admin/rules/${id}`, { enabled }, token);
    const r = await fetchWithAuth<FraudRule[]>("/dashboard/rules", token);
    setRules(r);
  };

  const retrain = async () => {
    const token = localStorage.getItem("access_token") || "";
    await postWithAuth("/admin/models/retrain", {}, token);
    setErr("Retrain job queued (stub).");
  };

  if (role !== "admin") {
    return (
      <AppShell title="Admin" subtitle="Restricted">
        <p className="text-sm text-slate-600 dark:text-slate-300">Admin role required. Sign in as an admin user.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Administration" subtitle="Users, rules, and model ops">
      {err ? <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">{err}</p> : null}
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
          <Users className="h-4 w-4" />
          Users
        </h3>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-soft text-left">
              <tr>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Active</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.role}</td>
                  <td className="py-2">{u.is_active ? "yes" : "no"}</td>
                  <td className="py-2 space-x-2">
                    <button
                      type="button"
                      className="text-xs text-sky-700 underline dark:text-sky-400"
                      onClick={() => void patchUser(u.id, { role: "analyst" })}
                    >
                      Make analyst
                    </button>
                    <button
                      type="button"
                      className="text-xs text-sky-700 underline dark:text-sky-400"
                      onClick={() => void patchUser(u.id, { role: "user" })}
                    >
                      Make user
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-700 underline dark:text-red-400"
                      onClick={() => void patchUser(u.id, { is_active: !u.is_active })}
                    >
                      Suspend/restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="glass-card p-4">
        <h3 className="mb-2 text-sm font-semibold">Fraud rules</h3>
        <ul className="space-y-2 text-sm">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-soft text-xs">{r.description}</p>
              </div>
              <button
                type="button"
                className="text-xs underline"
                onClick={() => void toggleRule(r.id, !r.enabled)}
              >
                {r.enabled ? "Disable" : "Enable"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
