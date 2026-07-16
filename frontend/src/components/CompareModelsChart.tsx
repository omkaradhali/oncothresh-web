/**
 * Grouped bar chart comparing several models at one threshold. Each metric is a group on the
 * x-axis, with one coloured bar per model, so a reader can scan across models within a metric.
 *
 * Only the six metrics that live on a 0–1 scale are plotted here (sensitivity, specificity, PPV,
 * NPV, F1, accuracy). MCC ranges [-1, 1] and would distort a shared 0–1 axis, so the panel reports
 * it separately as text.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompareModelsResult } from "../api/types";

interface Props {
  result: CompareModelsResult;
}

const METRICS = [
  { key: "sensitivity", name: "Sensitivity" },
  { key: "specificity", name: "Specificity" },
  { key: "ppv", name: "PPV" },
  { key: "npv", name: "NPV" },
  { key: "f1", name: "F1" },
  { key: "accuracy", name: "Accuracy" },
] as const;

// Categorical colours for model series (not tied to the metric palette, which colours metrics).
const MODEL_COLORS = ["#0b6bcb", "#12805c", "#8250df", "#b8600a", "#b42318"];

export default function CompareModelsChart({ result }: Props) {
  // Pivot to one row per metric, with a column per model, which is what a grouped BarChart wants.
  const data = METRICS.map((m) => {
    const row: Record<string, string | number> = { metric: m.name };
    result.model_names.forEach((name, i) => {
      row[name] = result.results[i][m.key];
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" />
        <XAxis dataKey="metric" fontSize={12} />
        <YAxis
          domain={[0, 1]}
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          fontSize={12}
        />
        <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
        <Legend />
        {result.model_names.map((name, i) => (
          <Bar key={name} dataKey={name} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
