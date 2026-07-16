/**
 * Bootstrap confidence intervals as a forest plot: one row per metric, a dot at the point
 * estimate and a horizontal whisker spanning its confidence interval. Narrow whiskers mean the
 * metric is well-pinned by the data; wide ones mean the estimate is uncertain at this threshold.
 */

import {
  CartesianGrid,
  ErrorBar,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BootstrapResult, CIEstimate } from "../api/types";

interface Props {
  result: BootstrapResult;
}

// Display order and labels for the metrics, top to bottom in the plot.
const METRICS: { key: keyof BootstrapResult; label: string }[] = [
  { key: "sensitivity", label: "Sensitivity" },
  { key: "specificity", label: "Specificity" },
  { key: "ppv", label: "PPV" },
  { key: "npv", label: "NPV" },
  { key: "f1", label: "F1" },
  { key: "mcc", label: "MCC" },
  { key: "accuracy", label: "Accuracy" },
];

interface Row {
  label: string;
  estimate: number;
  lower: number;
  upper: number;
  /** Asymmetric whisker lengths [below, above] the estimate, for recharts ErrorBar. */
  error: [number, number];
}

export default function BootstrapChart({ result }: Props) {
  const rows: Row[] = METRICS.map(({ key, label }) => {
    const ci = result[key] as CIEstimate;
    return {
      label,
      estimate: ci.estimate,
      lower: ci.lower,
      upper: ci.upper,
      error: [ci.estimate - ci.lower, ci.upper - ci.estimate],
    };
  });

  // Fit the x-axis to the data (MCC can go negative), padded and clamped to the metrics' [-1, 1].
  const lo = Math.min(...rows.map((r) => r.lower));
  const hi = Math.max(...rows.map((r) => r.upper));
  const domain: [number, number] = [Math.max(-1, lo - 0.05), Math.min(1, hi + 0.05)];

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" />
        <XAxis
          type="number"
          dataKey="estimate"
          domain={domain}
          tickFormatter={(v: number) => v.toFixed(2)}
          label={{
            value: `Metric value (${Math.round(result.confidence * 100)}% CI)`,
            position: "insideBottom",
            offset: -4,
            fontSize: 12,
          }}
          fontSize={12}
        />
        <YAxis type="category" dataKey="label" width={84} fontSize={12} />
        <Tooltip cursor={{ stroke: "#dfe3e8" }} content={<ForestTooltip />} />
        <Scatter data={rows} fill="var(--accent)" isAnimationActive={false}>
          <ErrorBar dataKey="error" direction="x" width={5} strokeWidth={2} stroke="var(--accent)" />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/** Renders "Sensitivity: 0.935 (0.897 – 0.971)" for the hovered metric row. */
function ForestTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{row.label}</strong>: {row.estimate.toFixed(3)}{" "}
      <span className="hint">
        ({row.lower.toFixed(3)} – {row.upper.toFixed(3)})
      </span>
    </div>
  );
}
