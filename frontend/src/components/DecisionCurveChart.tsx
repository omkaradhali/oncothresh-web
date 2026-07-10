/**
 * Decision Curve Analysis: net benefit vs threshold probability for three strategies. The
 * model curve is compared against "treat all" and "treat none" (the y=0 reference line). The
 * model earns its keep wherever its curve sits above both of the others.
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
import type { DecisionCurveResult } from "../api/types";

interface Props {
  result: DecisionCurveResult;
}

export default function DecisionCurveChart({ result }: Props) {
  // Recharts wants one row per x-value; zip the parallel arrays into point objects.
  const data = result.thresholds.map((pt, i) => ({
    pt,
    model: result.net_benefit_model[i],
    all: result.net_benefit_all[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" />
        <XAxis
          dataKey="pt"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v: number) => v.toFixed(2)}
          label={{
            value: "Threshold probability",
            position: "insideBottom",
            offset: -4,
            fontSize: 12,
          }}
          fontSize={12}
        />
        <YAxis
          tickFormatter={(v: number) => v.toFixed(3)}
          label={{ value: "Net benefit", angle: -90, position: "insideLeft", fontSize: 12 }}
          fontSize={12}
        />
        <Tooltip
          formatter={(v: number) => v.toFixed(4)}
          labelFormatter={(v: number) => `pt ${Number(v).toFixed(3)}`}
        />
        <Legend />
        <ReferenceLine
          y={0}
          stroke="#5b6673"
          strokeDasharray="4 4"
          label={{ value: "Treat none", fontSize: 11, fill: "#5b6673", position: "insideBottomRight" }}
        />
        <Line
          type="monotone"
          dataKey="model"
          name="Model"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="all"
          name="Treat all"
          stroke="var(--specificity)"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
