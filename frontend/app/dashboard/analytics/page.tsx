"use client";

import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";
    setLoading(true);
    Promise.all([
      fetchWithAuth<LabelValueResponse>("/dashboard/risk-distribution", token).catch(() => null),
      fetchWithAuth<LocationStat[]>("/dashboard/top-locations", token).catch(() => [] as LocationStat[]),
    ])
      .then(([risk, locs]) => {
        setRiskDistribution(risk);
        setLocations(locs);
      })
      .finally(() => setLoading(false));
  }, []);

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
            <TinyInfo icon={BarChart3} label="Detection Precision" value="96.2%" />
            <TinyInfo icon={MapPinned} label="Top Risk Corridor" value="London -> Lagos" />
          </div>
          <ScrollReveal placeholderClassName="min-h-[280px]">
            <RiskDoughnutChart
              labels={riskDistribution?.labels ?? []}
              values={riskDistribution?.values ?? []}
            />
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
