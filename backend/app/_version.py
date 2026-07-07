"""Version resolution for provenance stamping.

Every API response carries both the oncothresh-web version and the exact oncothresh
version that produced the numbers, so a result can always be traced back to the code
that generated it.

Both versions come from installed *distribution* metadata via ``importlib.metadata``
rather than a hardcoded module attribute, because a hand-written attribute can drift
from the packaged version in pyproject.toml while distribution metadata cannot.
"""

from importlib.metadata import PackageNotFoundError, version

from app import __version__ as _web_version


def _dist_version(package: str) -> str:
    try:
        return version(package)
    except PackageNotFoundError:  # pragma: no cover - only if run from an uninstalled tree
        return "unknown"


def oncothresh_version() -> str:
    """Exact installed version of the oncothresh library."""
    return _dist_version("oncothresh")


def oncothresh_web_version() -> str:
    """Version of this dashboard backend."""
    return _web_version
