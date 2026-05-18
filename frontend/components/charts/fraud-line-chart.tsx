"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { TrendingUp } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type FraudLineChartProps = {
  labels: string[];
  fraudSeries: number[];
  legitSeries: number[];
};

const lineDataset = {
  borderWidth: 2.5,
  pointRadius: 4,
  pointHoverRadius: 6,
  pointBorderWidth: 1.5,
  pointBackgroundColor: "#ffffff",
  tension: 0.4,
  fill: true,
};

export function FraudLineChart({ labels, fraudSeries, legitSeries }: FraudLineChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Fraud",
        data: fraudSeries,
        borderColor: "#f87171",
        backgroundColor: "rgba(248, 113, 113, 0.18)",
        pointBorderColor: "#f87171",
        ...lineDataset,
      },
      {
        label: "Legit",
        data: legitSeries,
        borderColor: "#34d399",
        backgroundColor: "rgba(52, 211, 153, 0.16)",
        pointBorderColor: "#34d399",
        ...lineDataset,
      },
    ],
  };

  return (
    <div className="glass-card overflow-hidden p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-emerald-500/10 text-cyan-700 dark:text-cyan-300">
          <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Fraud vs legit trend</h3>
      </div>
      <div className="relative h-[280px] w-full min-h-[220px]">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index" as const, intersect: false },
            animation: { duration: 820, easing: "easeOutQuart" as const },
            plugins: { legend: { position: "bottom" as const } },
            scales: {
              x: {
                ticks: { color: "#94a3b8" },
                grid: { color: "rgba(148,163,184,0.12)" },
              },
              y: {
                beginAtZero: true,
                ticks: { color: "#94a3b8" },
                grid: { color: "rgba(148,163,184,0.12)" },
              },
            },
            elements: {
              line: { borderJoinStyle: "round" as const },
              point: { hitRadius: 12 },
            },
          }}
        />
      </div>
    </div>
  );
}
