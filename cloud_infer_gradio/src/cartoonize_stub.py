from __future__ import annotations

import logging
import time
from io import BytesIO
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Local cache directory inside the Space or local run
CACHE_DIR = Path(__file__).resolve().parent.parent / "models_cache"


def _ensure_model_path(model_variant: str) -> Path:
    """Ensure a TFLite model for the requested variant exists in CACHE_DIR."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    model_id = "cartoongan-fp16" if model_variant == "fp16" else "cartoongan-int8"

    try:
        from cartoonizer.constants import REGISTERED_MODELS, TFHUB_BASE_URL  # type: ignore[import]
    except ImportError as exc:  # noqa: PERF203
        raise RuntimeError(
            "The 'cartoonizer' package is required in the Gradio Space environment. "
            "Install it (for example via `pip install -e models/cartoonizer`) "
            "before deploying."
        ) from exc

    if model_id not in REGISTERED_MODELS:
        raise RuntimeError(f"Unknown model_id in Gradio app: {model_id}")

    entry = REGISTERED_MODELS[model_id]
    model_path = CACHE_DIR / f"{entry.model_id}.tflite"
    if model_path.is_file():
        return model_path

    import requests  # type: ignore[import]

    url = f"{TFHUB_BASE_URL}/{entry.tfhub_id}?lite-format=tflite"
    logger.info(
        "Downloading TFLite model for Gradio Space",
        extra={"url": url, "destination": str(model_path)},
    )
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with model_path.open("wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if not chunk:
                    continue
                f.write(chunk)

    logger.info(
        "Downloaded TFLite model for Gradio Space",
        extra={"destination": str(model_path)},
    )
    return model_path


def cartoonize_with_tflite(image: Image.Image, model_variant: str) -> Tuple[Image.Image, Dict[str, float]]:
    """Run cartoonization using the shared TFLite pipeline from the cartoonizer package."""
    try:
        from cartoonizer.constants import MODEL_PROFILE_DEFAULT  # type: ignore[import]
        from cartoonizer.postprocess import postprocess_image  # type: ignore[import]
        from cartoonizer.preprocess import preprocess_image  # type: ignore[import]
        from cartoonizer.tflite_runner import TFLiteRunner  # type: ignore[import]
    except ImportError as exc:  # noqa: PERF203
        raise RuntimeError(
            "The 'cartoonizer' package and its dependencies must be installed to use "
            "the Gradio Space cartoonization pipeline."
        ) from exc

    model_path = _ensure_model_path(model_variant)

    input_array = np.array(image.convert("RGB"), dtype=np.uint8)

    total_start = time.perf_counter()
    preprocess_start = time.perf_counter()
    pre = preprocess_image(
        image=input_array,
        profile=MODEL_PROFILE_DEFAULT,
        max_size=MODEL_PROFILE_DEFAULT.input_size,
        resize_mode="fit",
        force_bgr=True,
    )
    preprocess_ms = (time.perf_counter() - preprocess_start) * 1000.0

    runner = TFLiteRunner(model_path)
    inference_start = time.perf_counter()
    output_tensor = runner.run(pre.tensor)
    inference_ms = (time.perf_counter() - inference_start) * 1000.0

    postprocess_start = time.perf_counter()
    post = postprocess_image(
        output_tensor=output_tensor,
        profile=MODEL_PROFILE_DEFAULT,
        target_size=input_array.shape[:2],
        from_bgr=True,
    )
    postprocess_ms = (time.perf_counter() - postprocess_start) * 1000.0
    total_ms = (time.perf_counter() - total_start) * 1000.0

    out_image = Image.fromarray(post.image)

    metrics: Dict[str, float] = {
        "preprocess_ms": preprocess_ms,
        "inference_ms": inference_ms,
        "postprocess_ms": postprocess_ms,
        "total_ms": total_ms,
    }

    logger.info(
        "Gradio cartoonization completed",
        extra={
            "variant": model_variant,
            "preprocess_ms": preprocess_ms,
            "inference_ms": inference_ms,
            "postprocess_ms": postprocess_ms,
            "total_ms": total_ms,
        },
    )

    return out_image, metrics