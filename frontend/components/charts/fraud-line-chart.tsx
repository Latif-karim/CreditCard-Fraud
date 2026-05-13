"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  tension: 0.35,
  fill: false,
};

export function FraudLineChart({ labels, fraudSeries, legitSeries }: FraudLineChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Fraud",
        data: fraudSeries,
        borderColor: "#f87171",
        backgroundColor: "rgba(248, 113, 113, 0.12)",
        pointBorderColor: "#f87171",
        ...lineDataset,
      },
      {
        label: "Legit",
        data: legitSeries,
        borderColor: "#34d399",
        backgroundColor: "rgba(52, 211, 153, 0.12)",
        pointBorderColor: "#34d399",
        ...lineDataset,
      },
    ],
  };

  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 mt-0 text-base font-semibold">Fraud vs Legit Trend</h3>
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
