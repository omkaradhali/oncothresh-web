# Example data

Sample datasets you can upload to `oncothresh-web` to try the dashboard without your own data.

## `sample_predictions.csv`

A synthetic cohort of **240 specimens** with model-predicted tumour cellularity, designed to
behave realistically around a **20% cellularity** clinical cutoff (a common minimum tumour
fraction for molecular assays).

| Column | Meaning |
|---|---|
| `cellularity_true` | Ground-truth tumour cellularity fraction (0.0–1.0), e.g. from a pathologist. |
| `cellularity_pred` | Model-predicted cellularity fraction (0.0–1.0). |
| `site` | Contributing institution (illustrative grouping column; optional). |

When you upload it, the dashboard auto-detects `cellularity_true` as the ground-truth column
and `cellularity_pred` as the predicted-score column. Try a threshold of **0.20** to see the
metrics and the threshold-sensitivity curve.

> The data is **synthetic and reproducible** (generated from a fixed random seed). It contains
> no real patient information and is provided purely to demonstrate the tool.
