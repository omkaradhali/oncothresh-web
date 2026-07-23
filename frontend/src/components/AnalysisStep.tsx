/**
 * Step 2: pick a clinical threshold and compute results.
 *
 * "Evaluate" fires only `/evaluate` — the headline metrics that anchor the whole Results view.
 * The deeper analyses live behind tabs and each fetches its own endpoint lazily, the first time
 * its tab is opened, keyed on the committed threshold (`metrics.threshold`). This keeps the page
 * short and avoids firing every endpoint on every recompute.
 */

import { useMemo, useState } from "react";
import { ApiError, evaluate, type DatasetArrays, type DatasetSource } from "../api/client";
import type { ParsedDataset, ResponseMeta, ThresholdResult } from "../api/types";
import { domain, formatPercentReadout } from "../config";
import BootstrapPanel from "./BootstrapPanel";
import CalibrationPanel from "./CalibrationPanel";
import CompareModelsPanel from "./CompareModelsPanel";
import DecisionCurvePanel from "./DecisionCurvePanel";
import MetricsPanel from "./MetricsPanel";
import MultiThresholdPanel from "./MultiThresholdPanel";
import NNTPanel from "./NNTPanel";
import SensitivityPanel from "./SensitivityPanel";

// Fallback example when a deployment hasn't configured a domain-specific one.
const GENERIC_EXAMPLE =
  "For instance, a 0.20 cutoff flags every sample scoring at or above 20%.";

type TabId =
  | "sensitivity"
  | "metrics-sweep"
  | "calibration"
  | "decision-curve"
  | "bootstrap-ci"
  | "nnt"
  | "compare-models";

const TABS: { id: TabId; label: string }[] = [
  { id: "sensitivity", label: "Threshold sensitivity" },
  { id: "metrics-sweep", label: "Metrics vs threshold" },
  { id: "calibration", label: "Calibration" },
  { id: "decision-curve", label: "Decision curve" },
  { id: "bootstrap-ci", label: "Confidence intervals" },
  { id: "nnt", label: "Number needed to test" },
  { id: "compare-models", label: "Compare models" },
];

interface Props {
  dataset: ParsedDataset;
  source: DatasetSource;
  onMeta: (meta: ResponseMeta) => void;
  onReset: () => void;
}

export default function AnalysisStep({ dataset, source, onMeta, onReset }: Props) {
  const [threshold, setThreshold] = useState(0.2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ThresholdResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("sensitivity");
  // Tabs render lazily: a panel mounts once visited, then stays mounted (hidden when inactive)
  // so switching tabs doesn't refetch. Visiting starts empty and grows as the user explores.
  const [visited, setVisited] = useState<Set<TabId>>(new Set());

  // Stable identity for the panels' fetch dependencies; the dataset itself never mutates.
  const arrays: DatasetArrays = useMemo(
    () => ({ y_true: dataset.y_true, y_pred: dataset.y_pred }),
    [dataset],
  );

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await evaluate(arrays, threshold);
      setMetrics(res.data);
      onMeta(res.meta);
      // Reveal the active tab immediately; other tabs stay lazy until opened.
      setVisited(new Set([activeTab]));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Computation failed.");
    } finally {
      setBusy(false);
    }
  }

  function openTab(id: TabId) {
    setActiveTab(id);
    setVisited((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
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
        <>
          <section className="card">
            <span className="step-label">Results · Threshold {metrics.threshold}</span>
            <h2>Classification metrics</h2>
            <MetricsPanel result={metrics} />
          </section>

          <section className="card">
            <p className="tabs-label">Detailed analyses</p>
            <div className="tabs" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`tab${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => openTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Each panel mounts once visited and persists; hidden keeps it in the DOM (and its
                fetched result) while inactive, so switching tabs never refetches. */}
            {visited.has("sensitivity") && (
              <div className="tabpanel" hidden={activeTab !== "sensitivity"} role="tabpanel">
                <SensitivityPanel arrays={arrays} threshold={metrics.threshold} />
              </div>
            )}
            {visited.has("metrics-sweep") && (
              <div className="tabpanel" hidden={activeTab !== "metrics-sweep"} role="tabpanel">
                <MultiThresholdPanel arrays={arrays} threshold={metrics.threshold} />
              </div>
            )}
            {visited.has("calibration") && (
              <div className="tabpanel" hidden={activeTab !== "calibration"} role="tabpanel">
                <CalibrationPanel arrays={arrays} threshold={metrics.threshold} />
              </div>
            )}
            {visited.has("decision-curve") && (
              <div className="tabpanel" hidden={activeTab !== "decision-curve"} role="tabpanel">
                <DecisionCurvePanel arrays={arrays} threshold={metrics.threshold} />
              </div>
            )}
            {visited.has("bootstrap-ci") && (
              <div className="tabpanel" hidden={activeTab !== "bootstrap-ci"} role="tabpanel">
                <BootstrapPanel arrays={arrays} threshold={metrics.threshold} />
              </div>
            )}
            {visited.has("nnt") && (
              <div className="tabpanel" hidden={activeTab !== "nnt"} role="tabpanel">
                <NNTPanel arrays={arrays} threshold={metrics.threshold} />
              </div>
            )}
            {visited.has("compare-models") && (
              <div className="tabpanel" hidden={activeTab !== "compare-models"} role="tabpanel">
                <CompareModelsPanel
                  dataset={dataset}
                  source={source}
                  threshold={metrics.threshold}
                />
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
