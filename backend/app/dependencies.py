"""Shared FastAPI dependencies."""

from app._version import oncothresh_version, oncothresh_web_version
from app.schemas import ResponseMeta


def response_meta() -> ResponseMeta:
    """Provenance stamped onto every successful compute response."""
    return ResponseMeta(
        oncothresh_version=oncothresh_version(),
        oncothresh_web_version=oncothresh_web_version(),
    )
