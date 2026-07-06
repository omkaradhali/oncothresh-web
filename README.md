# oncothresh-web

**Threshold-aware validation for oncology AI models, in your browser.**

`oncothresh-web` is a web dashboard that puts the [`oncothresh`](https://github.com/omkaradhali/oncothresh)
Python library in the hands of clinical researchers and pathologists who don't code. Upload a CSV of
model predictions, pick a clinical threshold (e.g. 20% tumour cellularity), and get calibration curves,
decision curves, threshold-sensitivity tables, bootstrap confidence intervals, number-needed-to-treat,
and a downloadable PDF report with citations.

> **Built on [`oncothresh`](https://github.com/omkaradhali/oncothresh).** This dashboard is a thin
> presentation layer. All numerical results are produced by the `oncothresh` library, which is the
> citable computational artifact. The dashboard version and the exact `oncothresh` version it ran are
> stamped into every generated report for reproducibility.

## Status

🚧 **Under active development.** The FastAPI backend (a REST layer over the `oncothresh` library) is in progress.

## Architecture

| Layer | Stack |
|---|---|
| Backend | FastAPI wrapping the `oncothresh` library (REST over its 8 evaluation methods) |
| Frontend | React (CSV upload, threshold selector, results + charts) |
| Reports | Server-side PDF export with embedded citations and version provenance |
| Deploy | Docker |

## Relationship to `oncothresh`

`oncothresh-web` depends on `oncothresh` via `pip` and pins an explicit version. The library owns the
science and its own release cadence; this repo owns the UI. See the backend README for the
version compatibility table.

## Citing

If you use `oncothresh-web` in research, please cite **both**:

- the **`oncothresh` library** (the methods) — see its
  [CITATION](https://github.com/omkaradhali/oncothresh/blob/main/CITATION.cff), and
- the **dashboard systems paper** (the tool) — _in preparation_.

## License

[MIT](LICENSE) © 2026 Omkar Adhali
