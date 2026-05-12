"use client";

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

type RiskDoughnutChartProps = {
  labels: string[];
  values: number[];
};

export function RiskDoughnutChart({ labels, values }: RiskDoughnutChartProps) {
  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 mt-0 text-base font-semibold">Risk Distribution</h3>
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: ["#73e0a9", "#ffb84d", "#ff7c4d", "#ff6363"],
              borderWidth: 0,
            },
          ],
        }}
      />
    </div>
  );
}
