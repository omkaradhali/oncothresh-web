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

// --- /decision-curve ---------------------------------------------------------

/**
 * Net-benefit curves from Decision Curve Analysis. `net_benefit_none` is omitted because it
 * is always 0 by definition; the chart draws it as a y=0 reference line.
 */
export interface DecisionCurveResult {
  clinical_threshold: number;
  prevalence: number;
  /** Threshold-probability (pt) values swept along the x-axis. */
  thresholds: number[];
  net_benefit_model: number[];
  net_benefit_all: number[];
}

// --- /boundary-calibration ---------------------------------------------------

/**
 * Reliability of the scores inside the boundary zone [threshold - window, threshold + window].
 * The per-bin mean arrays carry `null` for bins that caught no samples, so a reliability diagram
 * can skip those points rather than drawing them at zero.
 */
export interface BoundaryCalibrationResult {
  threshold: number;
  /** Half-width of the boundary zone; the zone spans [threshold - window, threshold + window]. */
  window: number;
  /** Samples whose predicted score fell inside the boundary zone. */
  n_samples: number;
  /** Boundary Expected Calibration Error, in score units (0.03 = 3 percentage points). NaN if empty. */
  ece: number;
  /** True when the zone averages at least 5 samples per bin; false flags a too-noisy ECE. */
  is_reliable: boolean;
  /** n_bins + 1 equal-width bin boundaries within the zone. */
  bin_edges: number[];
  /** Midpoint of each bin. */
  bin_centers: number[];
  /** Mean predicted score per bin; `null` for an empty bin. */
  bin_mean_predicted: (number | null)[];
  /** Mean actual outcome per bin; `null` for an empty bin. */
  bin_mean_actual: (number | null)[];
  /** Sample count per bin. */
  bin_counts: number[];
}
