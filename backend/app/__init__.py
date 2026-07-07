"""oncothresh-web backend: a thin FastAPI layer over the oncothresh library."""

from importlib.metadata import PackageNotFoundError, version

# Single source of truth: read the version from installed distribution metadata (which
# comes from pyproject.toml) so __version__ can never drift from the packaged version.
try:
    __version__ = version("oncothresh-web")
except PackageNotFoundError:  # imported from a source tree without an installed distribution
    __version__ = "0.0.0+unknown"
