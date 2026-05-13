import type { HeatmapResponse } from "@/lib/types";

export function RiskHeatmap({ cells }: { cells: HeatmapResponse["cells"] }) {
  const max = Math.max(...cells.map((c) => c.intensity), 1);
  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 text-base font-semibold">Risk concentration</h3>
      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto text-xs sm:grid-cols-3 md:grid-cols-4">
        {cells.map((c, i) => {
          const ratio = c.intensity / max;
          return (
            <div
              key={`${c.country}-${c.category}-${i}`}
              className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
              style={{
                backgroundColor: `rgba(239, 68, 68, ${0.12 + ratio * 0.55})`,
              }}
            >
              <p className="font-medium text-slate-800 dark:text-slate-100">{c.country}</p>
              <p className="text-soft">{c.category}</p>
              <p className="mt-1 font-semibold tabular-nums">{c.intensity}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
