/**
 * "Calibration" tab: fetches /boundary-calibration for the committed threshold and renders a
 * reliability diagram of the zone around it, with the boundary ECE and a reliability flag. The
 * fetch lives here so the endpoint only fires the first time this tab is opened.
 */

import { boundaryCalibration, type DatasetArrays } from "../api/client";
import { useEndpoint } from "../api/useEndpoint";
import CalibrationChart from "./CalibrationChart";

interface Props {
  arrays: DatasetArrays;
  threshold: number;
}

export default function CalibrationPanel({ arrays, threshold }: Props) {
  const { data, busy, error } = useEndpoint(
    () => boundaryCalibration(arrays, threshold),
    [arrays, threshold],
  );

  if (busy) return <p className="hint">Computing…</p>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return null;

  // No samples landed in the boundary zone: ECE is undefined, so there is nothing to plot.
  if (data.n_samples === 0) {
    return (
      <p className="hint">
        No samples fell within the boundary zone around this threshold, so calibration cannot be
        assessed here. Try a threshold nearer where the model's scores concentrate.
      </p>
    );
  }

  const ecePercent = (data.ece * 100).toFixed(1);
  const zoneLo = data.bin_edges[0];
  const zoneHi = data.bin_edges[data.bin_edges.length - 1];

  return (
    <>
      <p className="hint">
        How well the model's scores match reality in the decision zone{" "}
        {zoneLo.toFixed(2)}–{zoneHi.toFixed(2)}, where scores are close enough to the threshold to
        flip the call. Each point is a bin of samples: on the dashed line the predicted risk matched
        the observed rate; above it the model under-predicted, below it over-predicted.{" "}
        {data.n_samples} samples fell in this zone.
      </p>

      <div className="counts" style={{ marginBottom: "0.75rem" }}>
        <span>
          Boundary ECE: {ecePercent} percentage points
        </span>
        <span>
          {data.is_reliable
            ? "Reliable (≥5 samples/bin)"
            : "Sparse zone — ECE too noisy to trust"}
        </span>
      </div>

      <details className="callout">
        <summary>What is boundary calibration, and why only near the threshold?</summary>
        <p>
          <strong>Calibration</strong> asks whether a predicted score means what it says: of the
          samples scored around 0.20, do about 20% actually turn out positive? A well-calibrated
          model's points sit on the 45° line.
        </p>
        <p>
          This view weights the zone <em>around your threshold</em> rather than the whole 0–1 range,
          because that is where miscalibration changes a clinical decision. A model can be superbly
          calibrated on confident cases yet unreliable exactly at the cutoff, and it is the cutoff
          that decides who gets treated.
        </p>
        <p>
          The <strong>boundary ECE</strong> is the average gap between predicted and actual across
          these bins, in the same units as the score ({ecePercent} percentage points here). Lower is
          better. Read it alongside the <strong>reliability flag</strong>: a low ECE from only a
          handful of samples per bin is noise, not evidence of good calibration.
        </p>
      </details>

      <CalibrationChart result={data} />
    </>
  );
}
