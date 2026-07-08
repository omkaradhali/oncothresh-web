/**
 * Deployment-configurable domain labels.
 *
 * oncothresh-web is domain-agnostic: it validates any continuous oncology-AI score. The
 * copy defaults to generic wording so a fresh deployment reads sensibly out of the box, but
 * a deployer can specialise it to their use case (e.g. tumour cellularity) via Vite env vars
 * in `.env` — no code changes needed. See `.env.example` for the full list.
 */

export interface DomainConfig {
  /** Short unit appended after a percentage, e.g. "cellularity" → "20% cellularity". Empty for none. */
  scoreUnit: string;
  /** A concrete example sentence for the threshold explainer. Empty falls back to a generic one. */
  exampleUseCase: string;
}

export const domain: DomainConfig = {
  scoreUnit: import.meta.env.VITE_SCORE_UNIT ?? "",
  exampleUseCase: import.meta.env.VITE_EXAMPLE_USE_CASE ?? "",
};

/** The percentage readout shown next to the threshold input, with an optional unit suffix. */
export function formatPercentReadout(fraction: number): string {
  const pct = +(fraction * 100).toFixed(2);
  return domain.scoreUnit ? `= ${pct}% ${domain.scoreUnit}` : `= ${pct}%`;
}
