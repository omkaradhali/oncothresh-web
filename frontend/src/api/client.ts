/**
 * Typed HTTP client for the oncothresh-web backend.
 *
 * Every call unwraps the `{ meta, data }` envelope and returns both pieces, so callers
 * always have the provenance available alongside the result. Backend validation errors
 * (HTTP 422 with a `detail` field) are surfaced as `ApiError` with a readable message.
 */

import type {
  ApiResponse,
  BootstrapResult,
  BoundaryCalibrationResult,
  DecisionCurveResult,
  MultiThresholdReport,
  ParsedDataset,
  ResponseMeta,
  ThresholdResult,
  ThresholdSensitivityResult,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

/** Raised when the backend returns a non-2xx response. `detail` is the server's message. */
export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Shape of FastAPI/Starlette error bodies: `{ "detail": ... }`. */
async function readErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) {
      // FastAPI validation errors arrive as a list of {loc, msg} objects.
      return body.detail.map((e: { msg?: string }) => e.msg ?? "invalid input").join("; ");
    }
    return JSON.stringify(body);
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

async function postJson<T>(path: string, payload: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorDetail(res));
  return (await res.json()) as ApiResponse<T>;
}

// --- meta --------------------------------------------------------------------

export async function getVersion(): Promise<ResponseMeta> {
  const res = await fetch(`${API_BASE}/version`);
  if (!res.ok) throw new ApiError(res.status, await readErrorDetail(res));
  return (await res.json()) as ResponseMeta;
}

// --- CSV parsing (multipart, not JSON) ---------------------------------------

export async function parseCsv(
  file: File,
  yTrueCol: string,
  yPredCol: string,
  groupCol?: string,
): Promise<ApiResponse<ParsedDataset>> {
  const form = new FormData();
  form.append("file", file);
  form.append("y_true_col", yTrueCol);
  form.append("y_pred_col", yPredCol);
  if (groupCol) form.append("group_col", groupCol);

  const res = await fetch(`${API_BASE}/parse-csv`, { method: "POST", body: form });
  if (!res.ok) throw new ApiError(res.status, await readErrorDetail(res));
  return (await res.json()) as ApiResponse<ParsedDataset>;
}

/**
 * Read the header row of a CSV entirely in the browser, so the column mapper can offer a
 * dropdown before any upload. This peek is intentionally naive (first line, comma-split);
 * the authoritative parse happens server-side in the `oncothresh` library.
 */
export async function peekCsvHeader(file: File): Promise<string[]> {
  const text = await file.text();
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return firstLine
    .split(",")
    .map((c) => c.trim().replace(/^﻿/, "")) // strip a leading BOM if present
    .filter((c) => c.length > 0);
}

// --- compute endpoints -------------------------------------------------------

export interface DatasetArrays {
  y_true: number[];
  y_pred: number[];
}

export function evaluate(
  data: DatasetArrays,
  threshold: number,
): Promise<ApiResponse<ThresholdResult>> {
  return postJson<ThresholdResult>("/evaluate", { ...data, threshold });
}

export function thresholdSensitivity(
  data: DatasetArrays,
  threshold: number,
  delta = 0.05,
  step = 0.01,
): Promise<ApiResponse<ThresholdSensitivityResult>> {
  return postJson<ThresholdSensitivityResult>("/threshold-sensitivity", {
    ...data,
    threshold,
    delta,
    step,
  });
}

export function multiThresholdReport(
  data: DatasetArrays,
  thresholds: number[],
): Promise<ApiResponse<MultiThresholdReport>> {
  // The caller supplies the full sweep of thresholds; the backend evaluates every metric at each.
  return postJson<MultiThresholdReport>("/multi-threshold-report", { ...data, thresholds });
}

export function bootstrapCi(
  data: DatasetArrays,
  threshold: number,
  nBootstrap = 1000,
  confidence = 0.95,
): Promise<ApiResponse<BootstrapResult>> {
  // The backend resamples the dataset `nBootstrap` times to put a confidence interval around
  // every metric at this one threshold. Method (BCa) and random_state keep the library defaults.
  return postJson<BootstrapResult>("/bootstrap-ci", {
    ...data,
    threshold,
    n_bootstrap: nBootstrap,
    confidence,
  });
}

export function boundaryCalibration(
  data: DatasetArrays,
  threshold: number,
  window = 0.1,
  nBins = 10,
): Promise<ApiResponse<BoundaryCalibrationResult>> {
  // Assesses calibration only within [threshold - window, threshold + window], the zone where
  // scores actually decide the clinical call, then bins that zone into `nBins` for the diagram.
  return postJson<BoundaryCalibrationResult>("/boundary-calibration", {
    ...data,
    threshold,
    window,
    n_bins: nBins,
  });
}

export function decisionCurve(
  data: DatasetArrays,
  clinicalThreshold: number,
  thresholds?: number[],
): Promise<ApiResponse<DecisionCurveResult>> {
  // The backend binarises y_true at `clinical_threshold`, then sweeps `thresholds` (pt) for it.
  return postJson<DecisionCurveResult>("/decision-curve", {
    ...data,
    clinical_threshold: clinicalThreshold,
    thresholds: thresholds ?? null,
  });
}
