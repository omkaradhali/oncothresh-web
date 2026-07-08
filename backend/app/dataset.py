"""
CSV parsing and evaluator construction.

Isolates every point where user input meets the library, so validation errors are
turned into clean HTTP 422 responses in exactly one place. The library raises
``ValueError`` for bad data (mismatched lengths, NaN/inf, too few samples, bad params);
we translate those into 422 so clients get a readable message instead of a 500.
"""

import csv
import io

from fastapi import HTTPException
from oncothresh import ThresholdEvaluator

from app.schemas import ParsedDataset


def build_evaluator(y_true: list[float], y_pred: list[float]) -> ThresholdEvaluator:
    """Construct a ThresholdEvaluator, mapping library validation errors to HTTP 422."""
    try:
        return ThresholdEvaluator(y_true=y_true, y_pred=y_pred)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def run(fn, /, *args, **kwargs):
    """Call an oncothresh method, mapping its ValueError to HTTP 422.

    Bad *parameters* (e.g. an unknown bootstrap method, or non-probability inputs to
    decision_curve) are user errors, not server errors, so they surface as 422.
    """
    try:
        return fn(*args, **kwargs)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def parse_csv(
    raw: bytes,
    y_true_col: str,
    y_pred_col: str,
    group_col: str | None = None,
) -> ParsedDataset:
    """Parse an uploaded CSV into aligned float arrays.

    Uses only the stdlib csv module (no pandas) to keep the backend light. Every failure
    mode - unreadable file, missing column, non-numeric cell - becomes a 422 with a
    message that names the offending column or row.
    """
    try:
        # utf-8-sig transparently strips a BOM if present
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=422, detail="File is not valid UTF-8 text.") from exc

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise HTTPException(status_code=422, detail="CSV is empty or has no header row.")

    requested = [y_true_col, y_pred_col] + ([group_col] if group_col else [])
    missing = [c for c in requested if c not in reader.fieldnames]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Column(s) not found in CSV: {missing}. Available: {list(reader.fieldnames)}",
        )

    y_true: list[float] = []
    y_pred: list[float] = []
    group: list[str] = []

    # Data rows start at line 2 (line 1 is the header), which is what a user sees in a spreadsheet.
    for line_no, row in enumerate(reader, start=2):
        try:
            y_true.append(float(row[y_true_col]))
            y_pred.append(float(row[y_pred_col]))
        except (ValueError, TypeError) as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Non-numeric value in '{y_true_col}'/'{y_pred_col}' at CSV line {line_no}.",
            ) from exc
        if group_col:
            group.append(row[group_col])

    return ParsedDataset(
        y_true=y_true,
        y_pred=y_pred,
        group=group or None,
        n_rows=len(y_true),
        columns=list(reader.fieldnames),
    )
