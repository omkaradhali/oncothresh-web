/** Renders the six classification metrics from `/evaluate` plus the sample counts.
 *
 * Each metric card carries a detailed tooltip (shown on hover or keyboard focus) explaining
 * what the metric means clinically and why it matters, since these are easy to misread. */

import type { ThresholdResult } from "../api/types";

interface MetricDef {
  key: keyof ThresholdResult;
  label: string;
  /** How the number is displayed: a rate on [0,1] as a percent, or a raw coefficient. */
  format: "percent" | "coefficient";
  /** One-line plain-language definition. */
  definition: string;
  /** Why a clinician should care about this metric. */
  whyItMatters: string;
}

// "Positive" throughout means a sample predicted at or above the chosen threshold.
const METRICS: MetricDef[] = [
  {
    key: "sensitivity",
    label: "Sensitivity",
    format: "percent",
    definition:
      "Of all samples that are truly positive, the proportion the model correctly flags as positive (true positive rate, also called recall).",
    whyItMatters:
      "High sensitivity means few false negatives — the model rarely misses a true case. Prioritise this when a missed positive is costly.",
  },
  {
    key: "specificity",
    label: "Specificity",
    format: "percent",
    definition:
      "Of all samples that are truly negative, the proportion the model correctly identifies as negative (true negative rate).",
    whyItMatters:
      "High specificity means few false positives — the model rarely raises a false alarm. Prioritise this when acting on a false positive is harmful or expensive.",
  },
  {
    key: "ppv",
    label: "PPV",
    format: "percent",
    definition:
      "Positive predictive value (precision): of all samples the model predicts positive, the proportion that are truly positive.",
    whyItMatters:
      "Answers 'if the model says positive, how likely is that correct?'. Unlike sensitivity/specificity, PPV depends on how common positives are in your cohort (prevalence).",
  },
  {
    key: "npv",
    label: "NPV",
    format: "percent",
    definition:
      "Negative predictive value: of all samples the model predicts negative, the proportion that are truly negative.",
    whyItMatters:
      "Answers 'if the model says negative, how likely is that correct?'. Like PPV, it shifts with prevalence, so it can differ markedly between cohorts.",
  },
  {
    key: "f1",
    label: "F1 score",
    format: "percent",
    definition:
      "The harmonic mean of PPV (precision) and sensitivity (recall), summarising both in a single number between 0 and 1.",
    whyItMatters:
      "A balanced score when positives are rare: it stays low unless the model is good at both finding true positives and avoiding false ones.",
  },
  {
    key: "mcc",
    label: "MCC",
    format: "coefficient",
    definition:
      "Matthews correlation coefficient: the correlation between predicted and actual labels, ranging from -1 to +1.",
    whyItMatters:
      "+1 is perfect agreement, 0 is no better than chance, -1 is total disagreement. It stays honest under class imbalance, where accuracy can look deceptively high.",
  },
  {
    key: "accuracy",
    label: "Accuracy",
    format: "percent",
    definition:
      "The proportion of all samples classified correctly, counting both true positives and true negatives.",
    whyItMatters:
      "Intuitive but easily misleading: on an imbalanced cohort a model can score high accuracy just by favouring the majority class. Read it alongside MCC and F1.",
  },
];

interface Props {
  result: ThresholdResult;
}

function formatValue(value: number, format: MetricDef["format"]): string {
  return format === "percent" ? `${(value * 100).toFixed(1)}%` : value.toFixed(3);
}

export default function MetricsPanel({ result }: Props) {
  return (
    <div>
      <div className="metrics-grid">
        {METRICS.map(({ key, label, format, definition, whyItMatters }) => (
          // tabIndex makes the tooltip reachable by keyboard, not just mouse hover.
          <div className="metric" key={key} tabIndex={0} aria-label={`${label}. ${definition}`}>
            <span className="metric-info" aria-hidden="true">
              ⓘ
            </span>
            <div className="metric-value">{formatValue(result[key] as number, format)}</div>
            <p className="metric-label">{label}</p>
            <div className="metric-tip" role="tooltip">
              <strong>{label}</strong>
              <p>{definition}</p>
              <p className="metric-tip-why">{whyItMatters}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="counts">
        <span>Positives: {result.n_positive}</span>
        <span>Negatives: {result.n_negative}</span>
        <span>Total: {result.n_total}</span>
      </div>
    </div>
  );
}
