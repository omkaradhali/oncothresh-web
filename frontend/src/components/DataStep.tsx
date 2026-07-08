/**
 * Step 1: choose a CSV, map its columns, and parse it into aligned arrays.
 *
 * The header is peeked client-side to populate the column dropdowns, but the authoritative
 * parse is always done server-side by the `oncothresh` library via `/parse-csv`.
 */

import { useState } from "react";
import { ApiError, parseCsv, peekCsvHeader } from "../api/client";
import type { ParsedDataset } from "../api/types";

interface Props {
  onParsed: (dataset: ParsedDataset) => void;
}

export default function DataStep({ onParsed }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [yTrueCol, setYTrueCol] = useState("");
  const [yPredCol, setYPredCol] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function acceptFile(f: File) {
    setError(null);
    setFile(f);
    try {
      const header = await peekCsvHeader(f);
      setColumns(header);
      // Pre-select sensible defaults if the usual column names are present.
      setYTrueCol(header.find((c) => /true|label|gold|actual/i.test(c)) ?? header[0] ?? "");
      setYPredCol(header.find((c) => /pred|score|prob/i.test(c)) ?? header[1] ?? "");
    } catch {
      setError("Could not read the file header. Is this a text CSV?");
      setColumns([]);
    }
  }

  async function handleParse() {
    if (!file || !yTrueCol || !yPredCol) return;
    setBusy(true);
    setError(null);
    try {
      const res = await parseCsv(file, yTrueCol, yPredCol);
      onParsed(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to parse the CSV.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <span className="step-label">Step 1 · Data</span>
      <h2>Upload predictions</h2>

      <div
        className={`dropzone${dragging ? " dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files[0];
          if (dropped) void acceptFile(dropped);
        }}
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        {file ? (
          <span className="file-chip">📄 {file.name}</span>
        ) : (
          <>
            <strong>Choose a CSV</strong> or drag it here
          </>
        )}
        <input
          id="csv-input"
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void acceptFile(f);
          }}
        />
      </div>

      {columns.length > 0 && (
        <>
          <div className="field-row" style={{ marginTop: "1.25rem" }}>
            <div>
              <label htmlFor="y-true">Ground-truth column</label>
              <select id="y-true" value={yTrueCol} onChange={(e) => setYTrueCol(e.target.value)}>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="y-pred">Predicted-score column</label>
              <select id="y-pred" value={yPredCol} onChange={(e) => setYPredCol(e.target.value)}>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={handleParse} disabled={busy || !yTrueCol || !yPredCol || yTrueCol === yPredCol}>
            {busy ? "Parsing…" : "Load dataset"}
          </button>
          {yTrueCol === yPredCol && (
            <p className="hint">Ground-truth and predicted columns must be different.</p>
          )}
        </>
      )}

      {error && <div className="error">{error}</div>}
    </section>
  );
}
