/**
 * "Threshold sensitivity" tab: fetches /threshold-sensitivity for the committed threshold and
 * renders the sensitivity/specificity trade-off chart. Fetching lives here (not in the parent)
 * so the endpoint fires only when this tab is first opened.
 */

import { thresholdSensitivity, type DatasetArrays } from "../api/client";
import { useEndpoint } from "../api/useEndpoint";
import SensitivityChart from "./SensitivityChart";

interface Props {
  arrays: DatasetArrays;
  threshold: number;
}

export default function SensitivityPanel({ arrays, threshold }: Props) {
  const { data, busy, error } = useEndpoint(
    () => thresholdSensitivity(arrays, threshold),
    [arrays, threshold],
  );

  if (busy) return <p className="hint">Computing…</p>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return null;

  return (
    <>
      <p className="hint">
        How sensitivity and specificity respond as the threshold moves ±{data.delta} around the
        nominal value.
      </p>
      <SensitivityChart result={data} />
    </>
  );
}
