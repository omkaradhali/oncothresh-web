"""Version resolution for provenance stamping.

Every API response carries both the oncothresh-web version and the exact oncothresh
version that produced the numbers, so a result can always be traced back to the code
that generated it.

We read the oncothresh version from installed *distribution* metadata via
``importlib.metadata``, NOT from ``oncothresh.__version__``. At the time of writing the
library's ``__version__`` attribute is stale (reports 0.1.0 while the published
distribution is 0.1.1), so the attribute is not a reliable provenance source.
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
