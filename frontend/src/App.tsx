/**
 * Top-level flow: upload a dataset (step 1), then evaluate it at a threshold (step 2).
 *
 * State is intentionally flat and lives here so the two steps stay decoupled: `DataStep`
 * only knows how to produce a `ParsedDataset`, and `AnalysisStep` only consumes one.
 */

import { useState } from "react";
import type { ParsedDataset, ResponseMeta } from "./api/types";
import AnalysisStep from "./components/AnalysisStep";
import DataStep from "./components/DataStep";
import ProvenanceFooter from "./components/ProvenanceFooter";

export default function App() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [meta, setMeta] = useState<ResponseMeta | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>oncothresh-web</h1>
        <p>Threshold-aware validation for oncology AI models.</p>
      </header>

      {dataset ? (
        <AnalysisStep
          dataset={dataset}
          onMeta={setMeta}
          onReset={() => {
            setDataset(null);
            setMeta(null);
          }}
        />
      ) : (
        <DataStep onParsed={setDataset} />
      )}

      <ProvenanceFooter meta={meta} />
    </div>
  );
}
