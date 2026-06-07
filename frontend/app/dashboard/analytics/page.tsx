"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, MapPinned } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { CardGridSkeleton, ChartAreaSkeleton, TableSkeleton } from "@/components/skeletons";
import { RiskDoughnutChart } from "@/components/charts/risk-doughnut-chart";
import { ScrollReveal } from "@/components/scroll-reveal";
import { fetchWithAuth } from "@/lib/api";
import type { LabelValueResponse, LocationStat } from "@/lib/types";

export default function AnalyticsPage() {
  const [riskDistribution, setRiskDistribution] = useState<LabelValueResponse | null>(null);
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [modelMetrics, setModelMetrics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    setLoading(true);
    Promise.all([
      fetchWithAuth<LabelValueResponse>("/dashboard/risk-distribution", token).catch(() => null),
      fetchWithAuth<LocationStat[]>("/dashboard/top-locations", token).catch(() => [] as LocationStat[]),
      fetchWithAuth<Record<string, unknown>>("/dashboard/model-metrics", token).catch(() => null),
    ])
      .then(([risk, locs, metrics]) => {
        setRiskDistribution(risk);
        setLocations(locs);
        setModelMetrics(metrics);
      })
      .finally(() => setLoading(false));
  }, []);

  const precisionLabel = useMemo(() => {
    const p = modelMetrics?.precision_at_alert;
    if (p == null) return "—";
    const n = Number(p);
    return Number.isNaN(n) ? "—" : `${(n * 100).toFixed(1)}%`;
  }, [modelMetrics]);

  const topCorridor = useMemo(() => {
    if (!locations.length) return "—";
    const top = locations[0];
    return `${top.location} (${top.count} tx)`;
  }, [locations]);

  return (
    <RoleGuard allow={["analyst", "admin"]} title="Analytics">
    <AppShell title="Analytics" subtitle="Risk Intelligence">
      {loading ? (
        <div className="space-y-5">
          <CardGridSkeleton cards={2} />
          <ChartAreaSkeleton className="min-h-[280px]" />
          <TableSkeleton rows={5} cols={3} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <TinyInfo icon={BarChart3} label="Model precision (offline eval)" value={precisionLabel} />
            <TinyInfo icon={MapPinned} label="Top activity location" value={topCorridor} />
          </div>
          <ScrollReveal placeholderClassName="min-h-[280px]">
            {riskDistribution?.labels?.length ? (
              <RiskDoughnutChart labels={riskDistribution.labels} values={riskDistribution.values} />
            ) : (
              <p className="text-soft rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm dark:border-slate-800">
                No risk distribution data yet.
              </p>
            )}
          </ScrollReveal>
          <div className="glass-card p-4">
            <h3 className="mb-3 text-base font-semibold">Top Transaction Locations</h3>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="text-soft border-white/10 border-b">
                    <th align="left" className="pb-2">Location</th>
                    <th align="left" className="pb-2">Transaction Count</th>
                    <th align="left" className="pb-2">Avg Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((item) => (
                    <tr key={item.location} className="border-white/10 border-b last:border-0">
                      <td className="py-2">{item.location}</td>
                      <td className="py-2">{item.count}</td>
                      <td className="py-2">{item.avg_risk.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!locations.length ? <p className="text-soft mt-3">No location analytics yet.</p> : null}
          </div>
        </div>
      )}
    </AppShell>
    </RoleGuard>
  );
}

function TinyInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="text-soft flex items-center gap-2 text-xs">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
