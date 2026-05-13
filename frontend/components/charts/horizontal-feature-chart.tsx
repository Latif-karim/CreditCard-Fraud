"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Row = { feature: string; contribution: number };

export function HorizontalFeatureChart({ title, rows }: { title: string; rows: Row[] }) {
  const labels = rows.map((r) => r.feature);
  const data = rows.map((r) => r.contribution);
  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Influence",
              data,
              backgroundColor: "rgba(16, 185, 129, 0.55)",
              borderRadius: 6,
            },
          ],
        }}
        options={{
          indexAxis: "y",
          responsive: true,
          animation: { duration: 780, easing: "easeOutQuart" as const },
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
            y: { ticks: { color: "#94a3b8" }, grid: { display: false } },
          },
        }}
      />
    </div>
  );
}
