from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict


# Base URL for TF Hub TFLite models. We follow the convention:
# https://tfhub.dev/<publisher>/lite-model/<model>/<variant>/<version>?lite-format=tflite
TFHUB_BASE_URL = "https://tfhub.dev"


@dataclass(frozen=True)
class ModelProfile:
    """Describes I/O expectations for a TFLite cartoonization model."""

    input_size: int  # square input resolution (e.g., 256)
    force_bgr: bool  # whether to use BGR instead of RGB
    normalize_min: float  # typically -1.0
    normalize_max: float  # typically 1.0


# Default profile based on White-box CartoonGAN / CartoonGAN norms:
# - Input size: 256x256
# - BGR ordering
# - Normalized to [-1, 1]
MODEL_PROFILE_DEFAULT = ModelProfile(
    input_size=256,
    force_bgr=True,
    normalize_min=-1.0,
    normalize_max=1.0,
)


@dataclass(frozen=True)
class RegistryEntry:
    """In-code registry entry for known models."""

    model_id: str
    name: str
    description: str
    tfhub_id: str  # relative ID under TFHUB_BASE_URL
    variant: str
    profile: ModelProfile


# Known models for this project. The exact TF Hub paths can be updated in
# one place here without touching the rest of the code.
REGISTERED_MODELS: Dict[str, RegistryEntry] = {
    "cartoongan-fp16": RegistryEntry(
        model_id="cartoongan-fp16",
        name="CartoonGAN (TF Hub) – float16",
        description=(
            "Cartoonization model using CartoonGAN-style architecture, exported as "
            "a float16-optimized TFLite model from TF Hub."
        ),
        # The tfhub_id is combined with TFHUB_BASE_URL and '?lite-format=tflite'
        # to form the download URL:
        # https://tfhub.dev/google/lite-model/cartoongan/fp16/1?lite-format=tflite
        tfhub_id="google/lite-model/cartoongan/fp16/1",
        variant="fp16",
        profile=MODEL_PROFILE_DEFAULT,
    ),
    "cartoongan-int8": RegistryEntry(
        model_id="cartoongan-int8",
        name="CartoonGAN (TF Hub) – int8",
        description=(
            "Cartoonization model using CartoonGAN-style architecture, exported as "
            "an int8-quantized TFLite model from TF Hub."
        ),
        tfhub_id="google/lite-model/cartoongan/int8/1",
        variant="int8",
        profile=MODEL_PROFILE_DEFAULT,
    ),
}


def get_artifacts_root() -> Path:
    """Return the root directory for model artifacts.

    By default this is `models/artifacts/` in the repository structure.
    """
    # .../models/cartoonizer/src/cartoonizer/constants.py
    # parents[3] -> .../models
    models_dir = Path(__file__).resolve().parents[3]
    return models_dir / "artifacts"


ARTIFACTS_ROOT: Path = get_artifacts_root()
DOWNLOADED_DIR: Path = ARTIFACTS_ROOT / "downloaded"
CONVERTED_DIR: Path = ARTIFACTS_ROOT / "converted"
BENCHMARKS_DIR: Path = ARTIFACTS_ROOT / "benchmarks"


def ensure_artifact_dirs() -> None:
    """Create artifact directories if they do not exist."""
    DOWNLOADED_DIR.mkdir(parents=True, exist_ok=True)
    CONVERTED_DIR.mkdir(parents=True, exist_ok=True)
    BENCHMARKS_DIR.mkdir(parents=True, exist_ok=True)
