/**
 * "Confidence intervals" tab: fetches /bootstrap-ci for the committed threshold and renders each
 * metric as a forest-plot row. Fetching lives here so the (heavier, resampling) endpoint fires
 * only when this tab is first opened.
 */

import { bootstrapCi, type DatasetArrays } from "../api/client";
import { useEndpoint } from "../api/useEndpoint";
import BootstrapChart from "./BootstrapChart";

interface Props {
  arrays: DatasetArrays;
  threshold: number;
}

export default function BootstrapPanel({ arrays, threshold }: Props) {
  const { data, busy, error } = useEndpoint(
    () => bootstrapCi(arrays, threshold),
    [arrays, threshold],
  );

  if (busy) return <p className="hint">Resampling…</p>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return null;

  return (
    <>
      <p className="hint">
        Each metric at this threshold with a {Math.round(data.confidence * 100)}% confidence
        interval, from {data.n_bootstrap.toLocaleString()} bootstrap resamples. The dot is the point
        estimate; the bar is the range the true value plausibly falls in.
      </p>

      <details className="callout">
        <summary>How do I read these intervals?</summary>
        <p>
          A single number like “sensitivity = 0.94” hides how much your dataset could be pinning it
          down. <strong>Bootstrapping</strong> re-draws your samples (with replacement) many times
          and recomputes each metric, so the spread of those repeats becomes a{" "}
          <strong>confidence interval</strong>: the range the true value would plausibly occupy on
          data like yours.
        </p>
        <p>
          A <strong>narrow bar</strong> means the metric is well-supported by the data; a{" "}
          <strong>wide bar</strong> means you have too few cases near this threshold to trust the
          point estimate on its own. Two models whose intervals overlap heavily are not clearly
          different at this cutoff, however far apart their point estimates look.
        </p>
        <p className="hint">
          MCC ranges from -1 to 1 (0 is chance); the others range from 0 to 1. Intervals are
          computed with the bias-corrected accelerated (BCa) method.
        </p>
      </details>

      <BootstrapChart result={data} />
    </>
  );
}
