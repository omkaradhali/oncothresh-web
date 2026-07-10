/**
 * Plots the four threshold-dependent metrics (sensitivity, specificity, PPV, NPV) across a full
 * sweep of thresholds, so a clinician can see how each moves as the cutoff changes and read off
 * the trade-offs at any operating point. A reference line marks the currently chosen threshold.
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
import type { MultiThresholdReport } from "../api/types";

interface Props {
  report: MultiThresholdReport;
  /** The user's committed threshold, drawn as a vertical reference line. */
  chosen: number;
}

const SERIES = [
  { key: "sensitivity", name: "Sensitivity", color: "var(--sensitivity)" },
  { key: "specificity", name: "Specificity", color: "var(--specificity)" },
  { key: "ppv", name: "PPV", color: "var(--ppv)" },
  { key: "npv", name: "NPV", color: "var(--npv)" },
] as const;

export default function MultiThresholdChart({ report, chosen }: Props) {
  // Each ThresholdResult already has one row's worth of fields; recharts consumes them directly.
  const data = report.results.map((r) => ({
    threshold: r.threshold,
    sensitivity: r.sensitivity,
    specificity: r.specificity,
    ppv: r.ppv,
    npv: r.npv,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
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
          x={chosen}
          stroke="#5b6673"
          strokeDasharray="4 4"
          label={{ value: "your threshold", fontSize: 11, fill: "#5b6673" }}
        />
        {SERIES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
