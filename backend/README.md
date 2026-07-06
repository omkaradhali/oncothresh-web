# oncothresh-web · backend

FastAPI REST layer over the [`oncothresh`](https://github.com/omkaradhali/oncothresh) library.
Stateless: every request carries its own data; every response is stamped with the exact
`oncothresh` version that produced it.

## Endpoints

| Method | Path | oncothresh call |
|---|---|---|
| POST | `/evaluate` | `ThresholdEvaluator.evaluate` |
| POST | `/bootstrap-ci` | `ThresholdEvaluator.bootstrap_ci` |
| POST | `/multi-threshold-report` | `ThresholdEvaluator.multi_threshold_report` |
| POST | `/nnt` | `ThresholdEvaluator.nnt` |
| POST | `/threshold-sensitivity` | `ThresholdEvaluator.threshold_sensitivity` |
| POST | `/boundary-calibration` | `ThresholdEvaluator.boundary_calibration` |
| POST | `/decision-curve` | `ThresholdEvaluator.decision_curve` |
| POST | `/compare-models` | `compare_models` |
| POST | `/parse-csv` | CSV upload → aligned arrays |
| GET | `/version` | provenance (dashboard + library versions) |
| GET | `/health` | liveness probe |

Interactive docs at `/docs` once running.

## Compatibility

| oncothresh-web | oncothresh |
|---|---|
| 0.1.0 | 0.1.1 (pinned exactly) |

## Develop

```bash
cd backend
uv venv && uv pip install -e ".[dev]"
uv run uvicorn app.main:app --reload   # serve at http://localhost:8000
uv run pytest                          # run tests
```

CORS origins are configurable via `ONCOTHRESH_WEB_CORS_ORIGINS` (comma-separated;
defaults to `http://localhost:5173` for the Vite dev server).
