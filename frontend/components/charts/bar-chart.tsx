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
        backgroundColor: "rgba(59, 130, 246, 0.55)",
        borderRadius: 6,
      },
    ],
  };
  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
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
