# Example data

Sample datasets you can upload to `oncothresh-web` to try the dashboard without your own data.

## `sample_predictions.csv`

A synthetic cohort of **240 specimens** with model-predicted tumour cellularity, designed to
behave realistically around a **20% cellularity** clinical cutoff (a common minimum tumour
fraction for molecular assays).

| Column | Meaning |
|---|---|
| `cellularity_true` | Ground-truth tumour cellularity fraction (0.0–1.0), e.g. from a pathologist. |
| `cellularity_pred` | Predicted cellularity fraction (0.0–1.0) from a strong model. |
| `baseline_pred` | Predicted cellularity fraction (0.0–1.0) from a weaker baseline model, for the model comparison. |
| `site` | Contributing institution (illustrative grouping column; optional). |

When you upload it, the dashboard auto-detects `cellularity_true` as the ground-truth column
and `cellularity_pred` as the predicted-score column. Try a threshold of **0.20** to see the
metrics and the threshold-sensitivity curve.

### Comparing models

All compared models must score the **same specimens against the same ground truth**, so a
comparison lives in **one CSV**: keep a single `*_true` column and add one prediction column per
model (here, `cellularity_pred` and `baseline_pred`). In the **Compare models** tab, add the
second model by picking its prediction column — the shared ground-truth column keeps every model
aligned to the same rows. To compare your own models, follow this layout: one truth column, then
one score column per model.

> The data is **synthetic and reproducible** (generated from a fixed random seed). It contains
> no real patient information and is provided purely to demonstrate the tool.
