/**
 * Plots how sensitivity and specificity trade off as the decision threshold shifts around
 * the user's nominal value. A reference line marks the nominal threshold so the clinician
 * can see how fragile the operating point is to small threshold changes.
 */

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ThresholdSensitivityResult } from "../api/types";

interface Props {
  result: ThresholdSensitivityResult;
}

export default function SensitivityChart({ result }: Props) {
  // Recharts wants one row per x-value; zip the parallel arrays into point objects.
  const data = result.thresholds.map((threshold, i) => ({
    threshold,
    sensitivity: result.sensitivities[i],
    specificity: result.specificities[i],
  }));
  const nominal = result.thresholds[result.nominal_index];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" />
        <XAxis
          dataKey="threshold"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v: number) => v.toFixed(2)}
          label={{ value: "Threshold", position: "insideBottom", offset: -4, fontSize: 12 }}
          fontSize={12}
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          fontSize={12}
        />
        <Tooltip
          formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
          labelFormatter={(v: number) => `Threshold ${v.toFixed(3)}`}
        />
        <Legend />
        <ReferenceLine
          x={nominal}
          stroke="#5b6673"
          strokeDasharray="4 4"
          label={{ value: "nominal", fontSize: 11, fill: "#5b6673" }}
        />
        <Line
          type="monotone"
          dataKey="sensitivity"
          name="Sensitivity"
          stroke="var(--sensitivity)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="specificity"
          name="Specificity"
          stroke="var(--specificity)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
