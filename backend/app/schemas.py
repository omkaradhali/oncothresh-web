"""Request and response schemas for the API.

Request bodies mirror the oncothresh method signatures exactly (same parameter names and
defaults), so the wrapper stays a faithful, thin pass-through. Responses reuse the
library's own Pydantic result models unchanged, wrapped in a version-stamped envelope.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

# --- shared dataset payload ---------------------------------------------------


class DatasetPayload(BaseModel):
    """The two aligned score arrays every single-model method needs."""

    y_true: list[float] = Field(..., description="Ground-truth continuous scores (e.g. 0.0-1.0).")
    y_pred: list[float] = Field(..., description="Model-predicted continuous scores, same length as y_true.")


# --- per-method request models (names/defaults match oncothresh) --------------


class EvaluateRequest(DatasetPayload):
    threshold: float


class BootstrapCIRequest(DatasetPayload):
    threshold: float
    n_bootstrap: int = 1000
    confidence: float = 0.95
    random_state: int | None = None
    method: str = "bca"


class MultiThresholdRequest(DatasetPayload):
    thresholds: list[float]


class NNTRequest(DatasetPayload):
    threshold: float


class ThresholdSensitivityRequest(DatasetPayload):
    threshold: float
    delta: float = 0.05
    step: float = 0.01


class BoundaryCalibrationRequest(DatasetPayload):
    threshold: float
    window: float = 0.10
    n_bins: int = 10


class DecisionCurveRequest(DatasetPayload):
    clinical_threshold: float
    thresholds: list[float] | None = None


class ModelInput(BaseModel):
    """One model in a comparison: its predictions and an optional display name."""

    y_pred: list[float]
    name: str | None = None


class CompareModelsRequest(BaseModel):
    """All compared models share one y_true (same test set), each brings its own y_pred."""

    y_true: list[float]
    models: list[ModelInput]
    threshold: float


# --- response envelope --------------------------------------------------------


class ResponseMeta(BaseModel):
    """Provenance stamped onto every successful compute response."""

    oncothresh_version: str
    oncothresh_web_version: str


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Generic envelope: the library's result under ``data``, provenance under ``meta``."""

    meta: ResponseMeta
    data: T


# --- CSV parsing response -----------------------------------------------------


class ParsedDataset(BaseModel):
    """Result of parsing an uploaded CSV: the arrays plus a small summary for the UI."""

    y_true: list[float]
    y_pred: list[float]
    group: list[str] | None = None
    n_rows: int
    columns: list[str]
