/**
 * "Metrics vs threshold" tab: sweeps a fixed grid of thresholds through /multi-threshold-report
 * and plots how sensitivity, specificity, PPV and NPV each move across the full range. The sweep
 * itself doesn't depend on the chosen threshold, so it fetches once per dataset; the chosen value
 * is only drawn as a reference line.
 */

import { multiThresholdReport, type DatasetArrays } from "../api/client";
import { useEndpoint } from "../api/useEndpoint";
import MultiThresholdChart from "./MultiThresholdChart";

interface Props {
  arrays: DatasetArrays;
  threshold: number;
}

// A dense-but-bounded grid: fine enough for smooth curves, clear of the degenerate 0 and 1 ends
// where every sample falls on one side of the cutoff.
const SWEEP = Array.from({ length: 49 }, (_, i) => +((i + 1) * 0.02).toFixed(2));

export default function MultiThresholdPanel({ arrays, threshold }: Props) {
  const { data: report, busy, error } = useEndpoint(
    () => multiThresholdReport(arrays, SWEEP),
    [arrays],
  );

  if (busy) return <p className="hint">Computing…</p>;
  if (error) return <div className="error">{error}</div>;
  if (!report) return null;

  return (
    <>
      <p className="hint">
        How the four threshold-dependent metrics move as you slide the cutoff from low to high. Read
        a vertical slice at any threshold to see the trade-off you'd be accepting there; the dashed
        line marks the {(threshold * 100).toFixed(0)}% cutoff you chose.
      </p>

      <details className="callout">
        <summary>How do I use this chart?</summary>
        <p>
          The two solid clinical trade-offs are <strong>sensitivity</strong> (catching true cases)
          and <strong>specificity</strong> (avoiding false alarms). As the threshold rises,
          sensitivity falls and specificity climbs: raising the cutoff makes the model more
          conservative about calling something positive.
        </p>
        <p>
          <strong>PPV</strong> and <strong>NPV</strong> answer the question a clinician actually asks
          at the bench: "given what the model said, how much should I trust it?" Unlike sensitivity
          and specificity, both shift with how common the condition is in your cohort, so they are
          the ones to watch when deciding where a positive or negative call is reliable enough to act
          on.
        </p>
        <p>
          Look for where the curves cross or plateau. A threshold sitting on a steep part of a curve
          is fragile: a small change in the cutoff moves that metric a lot. A flatter region is a
          more stable operating point.
        </p>
      </details>

      <MultiThresholdChart report={report} chosen={threshold} />
    </>
  );
}
