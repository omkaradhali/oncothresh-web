/**
 * Top-level flow: upload a dataset (step 1), then evaluate it at a threshold (step 2).
 *
 * State is intentionally flat and lives here so the two steps stay decoupled: `DataStep`
 * only knows how to produce a `ParsedDataset`, and `AnalysisStep` only consumes one.
 */

import { useState } from "react";
import type { DatasetSource } from "./api/client";
import type { ParsedDataset, ResponseMeta } from "./api/types";
import AnalysisStep from "./components/AnalysisStep";
import DataStep from "./components/DataStep";
import ProvenanceFooter from "./components/ProvenanceFooter";

export default function App() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [source, setSource] = useState<DatasetSource | null>(null);
  const [meta, setMeta] = useState<ResponseMeta | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>oncothresh-web</h1>
        <p className="app-tagline">Threshold-aware validation for oncology AI models.</p>

        {!dataset && (
        <div className="app-intro">
          <p>
            <strong>oncothresh-web</strong> helps clinical researchers and pathologists validate
            oncology AI models at the decision thresholds that actually matter in practice, without
            writing any code.
          </p>
          <p>
            Most model reports stop at a single AUC. But in the clinic a model is only useful at a
            specific cutoff (for example, flagging cases above 20% tumour cellularity). This
            dashboard shows how a model behaves at that exact threshold: calibration, decision
            curves, sensitivity and specificity trade-offs, bootstrap confidence intervals, and
            number-needed-to-treat.
          </p>
          <ol className="app-steps">
            <li>
              <span className="app-step-num">1</span>
              Upload a CSV of predictions and true labels
            </li>
            <li>
              <span className="app-step-num">2</span>
              Choose your clinical threshold
            </li>
            <li>
              <span className="app-step-num">3</span>
              Review the metrics and export a cited PDF report
            </li>
          </ol>
        </div>
        )}
      </header>

      {dataset && source ? (
        <AnalysisStep
          dataset={dataset}
          source={source}
          onMeta={setMeta}
          onReset={() => {
            setDataset(null);
            setSource(null);
            setMeta(null);
          }}
        />
      ) : (
        <DataStep
          onParsed={(d, s) => {
            setDataset(d);
            setSource(s);
          }}
        />
      )}

      <ProvenanceFooter meta={meta} />
    </div>
  );
}
