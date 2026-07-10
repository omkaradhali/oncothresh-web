/**
 * "Decision curve" tab: fetches /decision-curve for the committed threshold and renders the
 * net-benefit chart, with a plain-language explainer for clinicians. Fetching lives here so the
 * (relatively heavier) endpoint fires only when this tab is first opened.
 */

import { decisionCurve, type DatasetArrays } from "../api/client";
import { useEndpoint } from "../api/useEndpoint";
import DecisionCurveChart from "./DecisionCurveChart";

interface Props {
  arrays: DatasetArrays;
  threshold: number;
}

export default function DecisionCurvePanel({ arrays, threshold }: Props) {
  const { data, busy, error } = useEndpoint(
    () => decisionCurve(arrays, threshold),
    [arrays, threshold],
  );

  if (busy) return <p className="hint">Computing…</p>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return null;

  return (
    <>
      <p className="hint">
        Net clinical benefit of letting the model decide who to treat, versus treating everyone or
        no one. The model adds value wherever its curve sits above both the “treat all” line and
        zero. Disease prevalence at this cutoff is {(data.prevalence * 100).toFixed(1)}%.
      </p>

      <details className="callout">
        <summary>How do I read a decision curve?</summary>
        <p>
          Every point on the x-axis is a <strong>threshold probability</strong>: how confident you
          would want to be before acting (treating, referring, retesting). It reflects how you weigh
          a missed case against an unnecessary intervention.
        </p>
        <p>
          <strong>Net benefit</strong> (y-axis) puts true positives and false positives on one
          scale, so the three strategies can be compared directly. Higher is better. Use the model
          only across the range where its curve is the highest of the three; where “treat all” or
          “treat none” is higher, the model is not helping at that operating point.
        </p>
      </details>

      <DecisionCurveChart result={data} />
    </>
  );
}
