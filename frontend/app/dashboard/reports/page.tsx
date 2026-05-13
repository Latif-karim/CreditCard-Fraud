"use client";

import { useState } from "react";
import { Download, FileJson } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { fetchBlobWithAuth, fetchWithAuth, getApiBase } from "@/lib/api";

export default function ReportsPage() {
  const [summary, setSummary] = useState<string>("");
  const [pdfNote, setPdfNote] = useState("");

  const dlCsv = async () => {
    const token = localStorage.getItem("access_token") || "";
    const blob = await fetchBlobWithAuth("/reports/transactions.csv", token);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSummary = async () => {
    const token = localStorage.getItem("access_token") || "";
    const j = await fetchWithAuth<Record<string, unknown>>("/reports/summary.json", token);
    setSummary(JSON.stringify(j, null, 2));
  };

  const loadPdfStub = async () => {
    const token = localStorage.getItem("access_token") || "";
    const res = await fetch(`${getApiBase()}/reports/summary.pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const j = await res.json();
    setPdfNote(JSON.stringify(j, null, 2));
  };

  return (
    <AppShell title="Reports & exports" subtitle="Compliance-ready outputs">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card space-y-3 p-4">
          <h3 className="text-sm font-semibold">Exports</h3>
          <button
            type="button"
            onClick={() => void dlCsv()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-sm text-white dark:bg-white dark:text-slate-900"
          >
            <Download className="h-4 w-4" />
            Download transactions CSV
          </button>
          <button
            type="button"
            onClick={() => void loadSummary()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm dark:border-slate-700"
          >
            <FileJson className="h-4 w-4" />
            Load JSON summary
          </button>
          <button
            type="button"
            onClick={() => void loadPdfStub()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm dark:border-slate-700"
          >
            PDF stub (JSON response)
          </button>
        </div>
        <div className="glass-card min-h-[200px] p-4">
          <h3 className="text-sm font-semibold">Preview</h3>
          <pre className="text-soft mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs">{summary || pdfNote || "—"}</pre>
        </div>
      </div>
    </AppShell>
  );
}
