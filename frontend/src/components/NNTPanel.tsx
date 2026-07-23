/**
 * "Number needed to test" tab: fetches /nnt for the committed threshold and renders the two NNT
 * figures as stat cards (no chart — the result is two numbers plus their PPV/NPV derivations).
 *
 * The clinically dangerous subtlety this panel has to get right: the backend serialises an
 * infinite NNT as `null`, and the two infinities mean OPPOSITE things. `nnt_positive === null`
 * (PPV=0) is bad — every positive call is a false alarm. `nnt_negative === null` (NPV=1) is good —
 * no cleared sample hides a missed case. Each card therefore carries its own adaptive caption so
 * an "∞" is never read as unconditionally good or bad.
 */

import { nnt, type DatasetArrays } from "../api/client";
import { useEndpoint } from "../api/useEndpoint";
import type { NNTResult } from "../api/types";

interface Props {
  arrays: DatasetArrays;
  threshold: number;
}

/** An infinite NNT arrives as `null` (JSON has no Infinity); show the maths symbol instead. */
function formatNnt(value: number | null): string {
  return value === null ? "∞" : value.toFixed(1);
}

function positiveCaption(value: number | null): string {
  if (value === null) {
    return "PPV is 0 at this threshold — every positive call is a false positive, so no number of flags yields a true case.";
  }
  return `On average ${value.toFixed(1)} positive call${value >= 1.5 ? "s" : ""} for each true positive found. Lower is more efficient (1.0 = every flag is correct).`;
}

function negativeCaption(value: number | null): string {
  if (value === null) {
    return "NPV is 1 at this threshold — no cleared sample is actually a missed case, so a negative call never conceals a true positive.";
  }
  return `On average 1 missed true positive hides among every ${value.toFixed(1)} cleared samples. Higher is safer (larger means misses are rarer).`;
}

export default function NNTPanel({ arrays, threshold }: Props) {
  const { data, busy, error } = useEndpoint<NNTResult>(() => nnt(arrays, threshold), [
    arrays,
    threshold,
  ]);

  if (busy) return <p className="hint">Computing…</p>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return null;

  return (
    <>
      <p className="hint">
        Number Needed to Test translates the model&rsquo;s decision boundary into two counts a
        clinician can act on: how many positive calls it takes to find one true case, and how many
        cleared samples it takes to conceal one missed case.
      </p>

      <details className="callout">
        <summary>How do I read these two numbers?</summary>
        <p>
          <strong>NNT to find a true positive</strong> is <code>1 / PPV</code>. It answers &ldquo;how
          many samples the model flags must I work through to find one real case?&rdquo; A value near
          1 means almost every flag is correct; a large value means most flags are false alarms.
        </p>
        <p>
          <strong>NNT to miss a true positive</strong> is <code>1 / (1 − NPV)</code>. It answers
          &ldquo;across how many samples the model clears does one missed case hide?&rdquo; Here a{" "}
          <em>larger</em> number is better — misses are rarer.
        </p>
        <p>
          An <strong>∞</strong> means opposite things for the two: infinite on the positive side is
          bad (the model never lands a correct positive), infinite on the negative side is good (the
          model never misses). Each card below spells out which case applies to your data.
        </p>
      </details>

      <div className="metrics-grid">
        <div
          className="metric"
          tabIndex={0}
          aria-label={`NNT to find one true positive: ${formatNnt(data.nnt_positive)}. ${positiveCaption(
            data.nnt_positive,
          )}`}
        >
          <span className="metric-info" aria-hidden="true">
            ⓘ
          </span>
          <div className="metric-value">{formatNnt(data.nnt_positive)}</div>
          <p className="metric-label">NNT to find a true positive</p>
          <div className="metric-tip" role="tooltip">
            <strong>1 / PPV — lower is better</strong>
            <p>{positiveCaption(data.nnt_positive)}</p>
            <p className="metric-tip-why">Derived from PPV = {(data.ppv * 100).toFixed(1)}%.</p>
          </div>
        </div>

        <div
          className="metric"
          tabIndex={0}
          aria-label={`NNT to miss one true positive: ${formatNnt(data.nnt_negative)}. ${negativeCaption(
            data.nnt_negative,
          )}`}
        >
          <span className="metric-info" aria-hidden="true">
            ⓘ
          </span>
          <div className="metric-value">{formatNnt(data.nnt_negative)}</div>
          <p className="metric-label">NNT to miss a true positive</p>
          <div className="metric-tip" role="tooltip">
            <strong>1 / (1 − NPV) — higher is safer</strong>
            <p>{negativeCaption(data.nnt_negative)}</p>
            <p className="metric-tip-why">Derived from NPV = {(data.npv * 100).toFixed(1)}%.</p>
          </div>
        </div>
      </div>

      <div className="counts">
        <span>Positives: {data.n_positive}</span>
        <span>Negatives: {data.n_negative}</span>
        <span>Total: {data.n_total}</span>
      </div>
    </>
  );
}
