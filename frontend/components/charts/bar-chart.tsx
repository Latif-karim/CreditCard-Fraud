"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { BarChart3 } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type SimpleBarChartProps = {
  title: string;
  labels: string[];
  values: number[];
  horizontal?: boolean;
};

export function SimpleBarChart({ title, labels, values, horizontal }: SimpleBarChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Count",
        data: values,
        backgroundColor: horizontal
          ? values.map((_, i) => `rgba(34, 211, 238, ${0.35 + (i % 3) * 0.15})`)
          : values.map((_, i) => `rgba(56, 189, 248, ${0.45 + (i % 4) * 0.1})`),
        borderColor: horizontal ? "rgba(34, 211, 238, 0.7)" : "rgba(56, 189, 248, 0.8)",
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-indigo-500/10 text-sky-700 dark:text-sky-300">
          <BarChart3 className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <Bar
        data={data}
        options={{
          indexAxis: horizontal ? "y" : "x",
          responsive: true,
          animation: { duration: 780, easing: "easeOutQuart" as const },
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
            y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
          },
        }}
      />
    </div>
  );
}
