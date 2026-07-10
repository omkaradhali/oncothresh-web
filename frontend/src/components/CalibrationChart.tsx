/**
 * Reliability diagram for the boundary zone: mean predicted score (x) against mean actual
 * outcome (y), one point per populated bin. The dashed 45° line is perfect calibration; a point
 * above it means the model under-predicted risk in that bin, below means it over-predicted.
 * Both axes share the boundary-zone range so the diagonal reads as a true 45°.
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
import type { BoundaryCalibrationResult } from "../api/types";

interface Props {
  result: BoundaryCalibrationResult;
}

export default function CalibrationChart({ result }: Props) {
  // One point per bin that actually caught samples; empty bins carry null and are dropped so
  // the line connects only real observations.
  const data = result.bin_mean_predicted
    .map((predicted, i) => ({
      predicted,
      actual: result.bin_mean_actual[i],
      count: result.bin_counts[i],
    }))
    .filter((p): p is { predicted: number; actual: number; count: number } =>
      p.predicted !== null && p.actual !== null,
    );

  // The bin edges are already clamped to [0, 1]; use them as the shared axis range so the
  // diagonal spans exactly the boundary zone.
  const lo = result.bin_edges[0];
  const hi = result.bin_edges[result.bin_edges.length - 1];

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" />
        <XAxis
          dataKey="predicted"
          type="number"
          domain={[lo, hi]}
          tickFormatter={(v: number) => v.toFixed(2)}
          label={{
            value: "Mean predicted score",
            position: "insideBottom",
            offset: -4,
            fontSize: 12,
          }}
          fontSize={12}
        />
        <YAxis
          type="number"
          domain={[lo, hi]}
          tickFormatter={(v: number) => v.toFixed(2)}
          label={{ value: "Mean actual outcome", angle: -90, position: "insideLeft", fontSize: 12 }}
          fontSize={12}
        />
        <Tooltip
          formatter={(v: number, name: string) =>
            name === "count" ? [v, "Samples in bin"] : [v.toFixed(3), "Mean actual"]
          }
          labelFormatter={(v: number) => `Predicted ${Number(v).toFixed(3)}`}
        />
        <Legend />
        {/* Perfect calibration: actual == predicted across the whole zone. */}
        <ReferenceLine
          segment={[
            { x: lo, y: lo },
            { x: hi, y: hi },
          ]}
          stroke="#5b6673"
          strokeDasharray="4 4"
          label={{
            value: "Perfect calibration",
            fontSize: 11,
            fill: "#5b6673",
            position: "insideTopLeft",
          }}
        />
        <Line
          type="linear"
          dataKey="actual"
          name="Model"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
