/**
 * "Compare models" tab: put two or more models side by side at the committed threshold.
 *
 * Every compared model must score the SAME specimens against the SAME ground truth (the backend
 * has no join key). We honour that by only ever adding models from sibling prediction columns of
 * the one uploaded file: each added column is re-parsed server-side with the same ground-truth
 * column, and we then assert its parsed y_true is identical to the loaded model's before comparing.
 * That makes a row mismatch impossible rather than merely unlikely.
 */

import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  compareModels,
  parseCsv,
  peekCsvHeader,
  type DatasetSource,
} from "../api/client";
import type { CompareModelsResult, ModelInput, ParsedDataset } from "../api/types";
import CompareModelsChart from "./CompareModelsChart";

interface Props {
  dataset: ParsedDataset;
  source: DatasetSource;
  threshold: number;
}

/** An extra model added for comparison: which column it came from, its label, and its scores. */
interface AddedModel {
  column: string;
  name: string;
  y_pred: number[];
}

/** True when two ground-truth arrays cover the exact same rows in the same order. */
function sameGroundTruth(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function CompareModelsPanel({ dataset, source, threshold }: Props) {
  // The loaded dataset is always model 1; added models are compared against it.
  const primaryName = source.yPredCol;
  const [added, setAdded] = useState<AddedModel[]>([]);

  const [header, setHeader] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [customName, setCustomName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [result, setResult] = useState<CompareModelsResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Peek the file header once so the dropdown can offer the other columns as candidate models.
  useEffect(() => {
    let cancelled = false;
    peekCsvHeader(source.file)
      .then((cols) => {
        if (!cancelled) setHeader(cols);
      })
      .catch(() => {
        if (!cancelled) setHeader([]);
      });
    return () => {
      cancelled = true;
    };
  }, [source.file]);

  // Columns still available to add: everything except the ground-truth column, the loaded model's
  // column, and any already added.
  const usedColumns = useMemo(
    () => new Set([source.yTrueCol, primaryName, ...added.map((m) => m.column)]),
    [source.yTrueCol, primaryName, added],
  );
  const candidateColumns = header.filter((c) => !usedColumns.has(c));

  // Keep the dropdown pointed at a still-valid column as the candidate set shrinks.
  useEffect(() => {
    if (!candidateColumns.includes(selectedColumn)) {
      setSelectedColumn(candidateColumns[0] ?? "");
    }
  }, [candidateColumns, selectedColumn]);

  const allModels: ModelInput[] = useMemo(
    () => [
      { y_pred: dataset.y_pred, name: primaryName },
      ...added.map((m) => ({ y_pred: m.y_pred, name: m.name })),
    ],
    [dataset.y_pred, primaryName, added],
  );

  // Re-run the comparison whenever the model set or threshold changes and there are ≥2 models.
  useEffect(() => {
    if (allModels.length < 2) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setComparing(true);
    setCompareError(null);
    compareModels(dataset.y_true, allModels, threshold)
      .then((res) => {
        if (!cancelled) setResult(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setCompareError(err instanceof ApiError ? err.message : "Comparison failed.");
      })
      .finally(() => {
        if (!cancelled) setComparing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [allModels, dataset.y_true, threshold]);

  async function handleAdd() {
    if (!selectedColumn) return;
    const name = customName.trim() || selectedColumn;
    if (name === primaryName || added.some((m) => m.name === name)) {
      setAddError(`A model named "${name}" is already in the comparison. Choose a different name.`);
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      // Re-parse this column through the same server parser + ground-truth column as the loaded
      // model, so its scores are aligned to the identical rows.
      const res = await parseCsv(source.file, source.yTrueCol, selectedColumn);
      if (!sameGroundTruth(res.data.y_true, dataset.y_true)) {
        setAddError(
          `"${selectedColumn}" has missing values in different rows, so it does not score the ` +
            "same specimens as the loaded model. Comparison needs every model scored on the same rows.",
        );
        return;
      }
      setAdded((prev) => [...prev, { column: selectedColumn, name, y_pred: res.data.y_pred }]);
      setCustomName("");
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Could not read that column.");
    } finally {
      setAdding(false);
    }
  }

  function removeModel(column: string) {
    setAdded((prev) => prev.filter((m) => m.column !== column));
  }

  return (
    <>
      <p className="hint">
        Compare models at your chosen threshold. Every model is scored on the same specimens and the
        same ground truth, so add each one as a prediction column from the file you uploaded.
      </p>

      <div className="model-chips">
        <span className="model-chip model-chip-primary">{primaryName} (loaded)</span>
        {added.map((m) => (
          <span className="model-chip" key={m.column}>
            {m.name}
            <button
              className="model-chip-remove"
              onClick={() => removeModel(m.column)}
              aria-label={`Remove ${m.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {candidateColumns.length > 0 ? (
        <div className="field-row" style={{ marginTop: "1rem", alignItems: "end" }}>
          <div>
            <label htmlFor="cmp-col">Add a model (prediction column)</label>
            <select
              id="cmp-col"
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
            >
              {candidateColumns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cmp-name">Display name (optional)</label>
            <input
              id="cmp-name"
              type="text"
              placeholder={selectedColumn}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
          <button onClick={handleAdd} disabled={adding || !selectedColumn}>
            {adding ? "Adding…" : "Add model"}
          </button>
        </div>
      ) : (
        <p className="hint" style={{ marginTop: "1rem" }}>
          No more prediction columns in this file to add. Upload a CSV with an extra score column to
          compare another model.
        </p>
      )}
      {addError && <div className="error">{addError}</div>}

      {allModels.length < 2 ? (
        <p className="hint" style={{ marginTop: "1rem" }}>
          Add at least one more model to see the comparison.
        </p>
      ) : compareError ? (
        <div className="error">{compareError}</div>
      ) : comparing || !result ? (
        <p className="hint" style={{ marginTop: "1rem" }}>
          Computing…
        </p>
      ) : (
        <>
          <CompareModelsChart result={result} />
          <p className="hint" style={{ marginTop: "0.75rem" }}>
            MCC (Matthews correlation, −1 to 1; shown separately from the 0–1 metrics above):{" "}
            {result.model_names
              .map((name, i) => `${name} ${result.results[i].mcc.toFixed(3)}`)
              .join(" · ")}
          </p>
        </>
      )}
    </>
  );
}
