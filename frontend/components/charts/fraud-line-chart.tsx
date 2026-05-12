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

export function FraudLineChart({ labels, fraudSeries, legitSeries }: FraudLineChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Fraud",
        data: fraudSeries,
        borderColor: "#ff6363",
        backgroundColor: "rgba(255, 99, 99, 0.2)",
      },
      {
        label: "Legit",
        data: legitSeries,
        borderColor: "#73e0a9",
        backgroundColor: "rgba(115, 224, 169, 0.2)",
      },
    ],
  };

  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 mt-0 text-base font-semibold">Fraud vs Legit Trend</h3>
      <Line data={data} />
    </div>
  );
}
