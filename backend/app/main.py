"""
FastAPI application entry point.

Wires up CORS, the evaluation router, the CSV-parsing endpoint, and health/version
routes. The app itself holds no state - every request carries its own data - so it
scales horizontally without sticky sessions.
"""

import os

from fastapi import APIRouter, Depends, FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app import dataset
from app._version import oncothresh_version, oncothresh_web_version
from app.dependencies import response_meta
from app.routers import evaluation
from app.schemas import ApiResponse, ParsedDataset, ResponseMeta

app = FastAPI(
    title="oncothresh-web API",
    version=oncothresh_web_version(),
    summary="REST layer over the oncothresh library for threshold aware oncology AI validation.",
    description=(
        "A thin, stateless wrapper over the oncothresh Python library. Every numerical "
        f"result is produced by oncothresh (currently {oncothresh_version()}) and each "
        "response is stamped with the exact library version for reproducibility."
    ),
)

# The frontend runs on a separate origin during development. Origins are read from
# ONCOTHRESH_WEB_CORS_ORIGINS (comma-separated); default to the common Vite dev port.
_origins = os.environ.get("ONCOTHRESH_WEB_CORS_ORIGINS", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluation.router)

meta_router = APIRouter(tags=["meta"])


@meta_router.get("/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


@meta_router.get("/version", response_model=ResponseMeta)
def get_version() -> ResponseMeta:
    """Report the dashboard and underlying library versions (provenance)."""
    return ResponseMeta(
        oncothresh_version=oncothresh_version(),
        oncothresh_web_version=oncothresh_web_version(),
    )


@meta_router.post("/parse-csv", response_model=ApiResponse[ParsedDataset])
def parse_csv_endpoint(
    file: UploadFile = File(..., description="CSV file with prediction columns."),
    y_true_col: str = Form(...),
    y_pred_col: str = Form(...),
    group_col: str | None = Form(None),
    meta: ResponseMeta = Depends(response_meta),
) -> ApiResponse:
    """Parse an uploaded CSV into aligned arrays the compute endpoints accept."""
    raw = file.file.read()
    parsed = dataset.parse_csv(raw, y_true_col, y_pred_col, group_col)
    return ApiResponse(meta=meta, data=parsed)


app.include_router(meta_router)
