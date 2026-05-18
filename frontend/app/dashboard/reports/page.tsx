"use client";

import { useState } from "react";
import { Download, FileJson, FileText, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { fetchBlobWithAuth, fetchWithAuth, getStoredToken, postWithAuth } from "@/lib/api";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [summary, setSummary] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const token = () => getStoredToken();

  const ensureData = async () => {
    await postWithAuth("/reports/seed", {}, token());
  };

  const dlCsv = async () => {
    setBusy("csv");
    setMsg("");
    try {
      let blob = await fetchBlobWithAuth("/reports/transactions.csv", token());
      if (blob.size < 80) {
        await ensureData();
        blob = await fetchBlobWithAuth("/reports/transactions.csv", token());
      }
      downloadBlob(blob, "fraudshield-transactions.csv");
      setMsg(`CSV downloaded (${blob.size} bytes).`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const dlPdf = async () => {
    setBusy("pdf");
    setMsg("");
    try {
      let blob = await fetchBlobWithAuth("/reports/summary.pdf", token());
      if (blob.size < 200 || blob.type.includes("json")) {
        await ensureData();
        blob = await fetchBlobWithAuth("/reports/summary.pdf", token());
      }
      if (blob.type.includes("json") || blob.size < 200) {
        const text = await blob.text();
        setMsg(`PDF failed: ${text.slice(0, 240)}`);
        return;
      }
      downloadBlob(blob, "fraudshield-summary.pdf");
      setMsg(`PDF downloaded (${blob.size} bytes).`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const dlSummaryJson = async () => {
    setBusy("json-dl");
    setMsg("");
    try {
      const j = await fetchWithAuth<Record<string, unknown>>("/reports/summary.json", token());
      const text = JSON.stringify(j, null, 2);
      setSummary(text);
      downloadBlob(new Blob([text], { type: "application/json" }), "fraudshield-summary.json");
      setMsg("Summary JSON downloaded.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const dlAuditJson = async () => {
    setBusy("audit");
    setMsg("");
    try {
      const blob = await fetchBlobWithAuth("/reports/audit-export.json", token());
      downloadBlob(blob, "fraudshield-audit.json");
      setMsg(`Audit log downloaded (${blob.size} bytes).`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const previewSummary = async () => {
    setBusy("json");
    try {
      const j = await fetchWithAuth<Record<string, unknown>>("/reports/summary.json", token());
      setSummary(JSON.stringify(j, null, 2));
      setMsg("Summary preview loaded.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const seedData = async () => {
    setBusy("seed");
    try {
      const j = await postWithAuth<{
        transaction_total: number;
        transactions_added: number;
      }>("/reports/seed", {}, token());
      setMsg(`Dataset ready: ${j.transaction_total} transactions (${j.transactions_added} added this run).`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <RoleGuard allow={["analyst", "admin"]} title="Reports">
    <AppShell title="Reports & exports" subtitle="Compliance-ready outputs">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="fintech-panel space-y-3 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Exports</h3>
          <p className="text-soft text-xs leading-relaxed">
            Reports auto-seed demo data when needed. Restart the Flask backend after pulling updates and run{" "}
            <code className="text-[10px]">pip install fpdf2</code> for PDF support.
          </p>
          <button type="button" disabled={!!busy} onClick={() => void dlCsv()} className="btn-fintech-primary w-full disabled:opacity-60">
            <Download className="mr-2 inline h-4 w-4" />
            {busy === "csv" ? "Preparing…" : "Download transactions CSV"}
          </button>
          <button type="button" disabled={!!busy} onClick={() => void dlPdf()} className="btn-fintech-primary w-full disabled:opacity-60">
            <FileText className="mr-2 inline h-4 w-4" />
            {busy === "pdf" ? "Building…" : "Download fraud summary PDF"}
          </button>
          <button type="button" disabled={!!busy} onClick={() => void dlSummaryJson()} className="btn-fintech-secondary w-full disabled:opacity-60">
            <FileJson className="mr-2 inline h-4 w-4" />
            Download summary JSON
          </button>
          <button type="button" disabled={!!busy} onClick={() => void dlAuditJson()} className="btn-fintech-secondary w-full disabled:opacity-60">
            <FileJson className="mr-2 inline h-4 w-4" />
            Download audit log JSON
          </button>
          <button type="button" disabled={!!busy} onClick={() => void previewSummary()} className="btn-fintech-secondary w-full disabled:opacity-60">
            Preview summary in panel
          </button>
          <button type="button" disabled={!!busy} onClick={() => void seedData()} className="btn-fintech-secondary w-full disabled:opacity-60">
            <RefreshCw className="mr-2 inline h-4 w-4" />
            Refresh demo dataset
          </button>
          {msg ? <p className="text-sm text-slate-600 dark:text-slate-300">{msg}</p> : null}
        </div>
        <div className="fintech-panel min-h-[240px] p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Preview</h3>
          <pre className="text-soft mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-100/80 p-3 text-xs dark:bg-slate-950/50">
            {summary || "Run a preview or download a report to see output here."}
          </pre>
        </div>
      </div>
    </AppShell>
    </RoleGuard>
  );
}

