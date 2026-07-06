"""Endpoint tests: every method returns 200 with a version-stamped envelope, and bad
input is rejected as 422 rather than crashing."""

from tests.conftest import Y_PRED_2, Y_TRUE


def _assert_envelope(body: dict) -> dict:
    """Every successful compute response has provenance meta + a data payload."""
    assert "meta" in body and "data" in body
    assert body["meta"]["oncothresh_version"]  # non-empty
    assert body["meta"]["oncothresh_web_version"]
    return body["data"]


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_version_reports_installed_library(client):
    body = client.get("/version").json()
    # Provenance must reflect the installed distribution (0.1.1), not the library's
    # stale __version__ attribute (0.1.0).
    assert body["oncothresh_version"] == "0.1.1"
    assert body["oncothresh_web_version"] == "0.1.0"


def test_evaluate(client, dataset):
    body = client.post("/evaluate", json={**dataset, "threshold": 0.20})
    assert body.status_code == 200
    data = _assert_envelope(body.json())
    assert data["threshold"] == 0.20
    assert 0.0 <= data["sensitivity"] <= 1.0


def test_bootstrap_ci_is_deterministic_with_seed(client, dataset):
    payload = {**dataset, "threshold": 0.20, "n_bootstrap": 200, "random_state": 42}
    first = client.post("/bootstrap-ci", json=payload).json()
    second = client.post("/bootstrap-ci", json=payload).json()
    assert first["data"] == second["data"]  # same seed -> identical CIs


def test_multi_threshold_report(client, dataset):
    body = client.post("/multi-threshold-report", json={**dataset, "thresholds": [0.20, 0.50]})
    assert body.status_code == 200
    _assert_envelope(body.json())


def test_nnt(client, dataset):
    body = client.post("/nnt", json={**dataset, "threshold": 0.20})
    assert body.status_code == 200
    data = _assert_envelope(body.json())
    assert data["threshold"] == 0.20


def test_threshold_sensitivity(client, dataset):
    body = client.post("/threshold-sensitivity", json={**dataset, "threshold": 0.20})
    assert body.status_code == 200
    _assert_envelope(body.json())


def test_boundary_calibration(client, dataset):
    body = client.post("/boundary-calibration", json={**dataset, "threshold": 0.20})
    assert body.status_code == 200
    _assert_envelope(body.json())


def test_decision_curve(client, dataset):
    body = client.post("/decision-curve", json={**dataset, "clinical_threshold": 0.20})
    assert body.status_code == 200
    _assert_envelope(body.json())


def test_compare_models_with_names(client):
    body = client.post(
        "/compare-models",
        json={
            "y_true": Y_TRUE,
            "threshold": 0.20,
            "models": [
                {"y_pred": Y_TRUE, "name": "Perfect"},
                {"y_pred": Y_PRED_2, "name": "Challenger"},
            ],
        },
    )
    assert body.status_code == 200
    _assert_envelope(body.json())


def test_compare_models_auto_names_when_unnamed(client):
    body = client.post(
        "/compare-models",
        json={
            "y_true": Y_TRUE,
            "threshold": 0.20,
            "models": [{"y_pred": Y_TRUE}, {"y_pred": Y_PRED_2}],
        },
    )
    assert body.status_code == 200


# --- validation: library errors surface as 422, not 500 ----------------------


def test_mismatched_lengths_is_422(client):
    body = client.post("/evaluate", json={"y_true": [0.1, 0.2], "y_pred": [0.1], "threshold": 0.2})
    assert body.status_code == 422


def test_nan_is_422(client):
    # JSON has no NaN literal; the library rejects non-finite values. Send via a string
    # that Python's float() would choke on is not valid JSON, so use too-few-samples instead
    # here and cover NaN through the CSV path in test_dataset.
    body = client.post("/evaluate", json={"y_true": [0.1], "y_pred": [0.2], "threshold": 0.2})
    assert body.status_code == 422  # fewer than 2 samples


def test_bad_bootstrap_method_is_422(client, dataset):
    body = client.post(
        "/bootstrap-ci",
        json={**dataset, "threshold": 0.20, "method": "not-a-real-method"},
    )
    assert body.status_code == 422


def test_compare_models_single_model_is_422(client):
    body = client.post(
        "/compare-models",
        json={"y_true": Y_TRUE, "threshold": 0.20, "models": [{"y_pred": Y_TRUE}]},
    )
    assert body.status_code == 422  # library requires >= 2 evaluators
