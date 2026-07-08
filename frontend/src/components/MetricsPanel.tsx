/** Renders the six classification metrics from `/evaluate` plus the sample counts. */

import type { ThresholdResult } from "../api/types";

interface Props {
  result: ThresholdResult;
}

/** Metrics that read naturally as percentages; MCC is a correlation on [-1, 1], so it stays raw. */
const PERCENT_METRICS: { key: keyof ThresholdResult; label: string }[] = [
  { key: "sensitivity", label: "Sensitivity" },
  { key: "specificity", label: "Specificity" },
  { key: "ppv", label: "PPV" },
  { key: "npv", label: "NPV" },
  { key: "f1", label: "F1 score" },
  { key: "accuracy", label: "Accuracy" },
];

function asPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function MetricsPanel({ result }: Props) {
  return (
    <div>
      <div className="metrics-grid">
        {PERCENT_METRICS.map(({ key, label }) => (
          <div className="metric" key={key}>
            <div className="metric-value">{asPercent(result[key] as number)}</div>
            <p className="metric-label">{label}</p>
          </div>
        ))}
        <div className="metric">
          <div className="metric-value">{result.mcc.toFixed(3)}</div>
          <p className="metric-label">MCC</p>
        </div>
      </div>
      <div className="counts">
        <span>Positives: {result.n_positive}</span>
        <span>Negatives: {result.n_negative}</span>
        <span>Total: {result.n_total}</span>
      </div>
    </div>
  );
}
