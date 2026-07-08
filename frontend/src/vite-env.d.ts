/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API. */
  readonly VITE_API_BASE?: string;
  /** Optional unit suffix for the percentage readout, e.g. "cellularity". */
  readonly VITE_SCORE_UNIT?: string;
  /** Optional concrete example sentence for the threshold explainer. */
  readonly VITE_EXAMPLE_USE_CASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
