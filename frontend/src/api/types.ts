/**
 * TypeScript mirror of the backend's Pydantic contract.
 *
 * These types are kept deliberately faithful to `backend/app/schemas.py` and the
 * `oncothresh` result models. If the backend contract changes, update these in lockstep;
 * the compiler is our early-warning system for drift.
 */

// --- response envelope (every successful compute response) -------------------

/** Provenance stamped onto every response so a result traces back to exact code. */
export interface ResponseMeta {
  oncothresh_version: string;
  oncothresh_web_version: string;
}

/** Generic envelope: the library's result under `data`, provenance under `meta`. */
export interface ApiResponse<T> {
  meta: ResponseMeta;
  data: T;
}

// --- /parse-csv --------------------------------------------------------------

/** Result of parsing an uploaded CSV: the aligned arrays plus a summary for the UI. */
export interface ParsedDataset {
  y_true: number[];
  y_pred: number[];
  group: string[] | null;
  n_rows: number;
  columns: string[];
}

// --- /evaluate ---------------------------------------------------------------

/** Classification metrics at a single clinical threshold. */
export interface ThresholdResult {
  threshold: number;
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  f1: number;
  mcc: number;
  accuracy: number;
  n_positive: number;
  n_negative: number;
  n_total: number;
}

// --- /threshold-sensitivity --------------------------------------------------

/** How sensitivity/specificity move as the threshold shifts around a nominal value. */
export interface ThresholdSensitivityResult {
  nominal_threshold: number;
  delta: number;
  thresholds: number[];
  shifts: number[];
  sensitivities: number[];
  specificities: number[];
  /** Index into the arrays marking the nominal (user-chosen) threshold. */
  nominal_index: number;
}
