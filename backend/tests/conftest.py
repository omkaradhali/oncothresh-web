"""Shared fixtures: a TestClient and a small, well-behaved dataset.

The dataset spans [0, 1] with a mix of positives and negatives around the 0.20 cutoff,
so every method (including decision_curve, which needs probability-scale predictions and
both classes present) has something meaningful to compute.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

# 10 samples, both classes present at threshold 0.20, all scores in [0, 1].
Y_TRUE = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.10, 0.30, 0.60, 0.80]
Y_PRED = [0.10, 0.12, 0.30, 0.40, 0.42, 0.60, 0.05, 0.35, 0.55, 0.75]
Y_PRED_2 = [0.20, 0.05, 0.28, 0.50, 0.38, 0.65, 0.08, 0.30, 0.70, 0.60]


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def dataset() -> dict[str, list[float]]:
    return {"y_true": list(Y_TRUE), "y_pred": list(Y_PRED)}
