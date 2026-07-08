/**
 * Step 2: pick a clinical threshold and compute results.
 *
 * Fires `/evaluate` and `/threshold-sensitivity` together against the parsed dataset, then
 * renders the metrics panel and the sensitivity chart. Each recompute restamps provenance.
 */

import { useState } from "react";
import { ApiError, evaluate, thresholdSensitivity } from "../api/client";
import type { ParsedDataset, ResponseMeta, ThresholdResult, ThresholdSensitivityResult } from "../api/types";
import { domain, formatPercentReadout } from "../config";
import MetricsPanel from "./MetricsPanel";
import SensitivityChart from "./SensitivityChart";

// Fallback example when a deployment hasn't configured a domain-specific one.
const GENERIC_EXAMPLE =
  "For instance, a 0.20 cutoff flags every sample scoring at or above 20%.";

interface Props {
  dataset: ParsedDataset;
  onMeta: (meta: ResponseMeta) => void;
  onReset: () => void;
}

export default function AnalysisStep({ dataset, onMeta, onReset }: Props) {
  const [threshold, setThreshold] = useState(0.2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ThresholdResult | null>(null);
  const [sensitivity, setSensitivity] = useState<ThresholdSensitivityResult | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const arrays = { y_true: dataset.y_true, y_pred: dataset.y_pred };
    try {
      const [evalRes, sensRes] = await Promise.all([
        evaluate(arrays, threshold),
        thresholdSensitivity(arrays, threshold),
      ]);
      setMetrics(evalRes.data);
      setSensitivity(sensRes.data);
      onMeta(evalRes.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Computation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card">
        <span className="step-label">Step 2 · Threshold</span>
        <h2>Choose a clinical threshold</h2>
        <p className="hint">
          Loaded {dataset.n_rows.toLocaleString()} rows. Predictions are classified positive at or
          above this cutoff.
        </p>

        <details className="callout">
          <summary>What is a threshold, and why is it on a 0–1 scale?</summary>
          <p>
            The model gives each sample a continuous score. A <strong>threshold</strong> is the cutoff
            that turns that score into a yes/no decision: a sample is called <em>positive</em> when
            its score is at or above the threshold. {domain.exampleUseCase || GENERIC_EXAMPLE}
          </p>
          <p>
            Where you set it is a <strong>clinical choice, not just a statistical one</strong>.
            Lowering the threshold catches more true positives (higher sensitivity) but adds false
            positives (lower specificity); raising it does the reverse. The same model can look
            excellent or poor depending on the cutoff, which is exactly why validating around the
            threshold matters.
          </p>
          <p>
            Scores and the threshold use a <strong>0–1 fraction scale</strong>, the same scale as the
            underlying proportion: <code>0.20 = 20%</code>, <code>0.30 = 30%</code>. So enter a 20%
            rule as <code>0.20</code>.
          </p>
        </details>

        <div className="field-row" style={{ marginTop: "1rem", alignItems: "end" }}>
          <div>
            <label htmlFor="threshold">Threshold</label>
            <input
              id="threshold"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <p className="hint" style={{ marginTop: "0.35rem" }}>
              {formatPercentReadout(threshold)}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={run} disabled={busy}>
              {busy ? "Computing…" : "Evaluate"}
            </button>
            <button className="secondary" onClick={onReset} disabled={busy}>
              New dataset
            </button>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
      </section>

      {metrics && (
        <section className="card">
          <span className="step-label">Results · Threshold {metrics.threshold}</span>
          <h2>Classification metrics</h2>
          <MetricsPanel result={metrics} />
        </section>
      )}

      {sensitivity && (
        <section className="card">
          <span className="step-label">Results</span>
          <h2>Threshold sensitivity</h2>
          <p className="hint">
            How sensitivity and specificity respond as the threshold moves ±{sensitivity.delta}
            around the nominal value.
          </p>
          <SensitivityChart result={sensitivity} />
        </section>
      )}
    </>
  );
}
