from __future__ import annotations

import logging
import time
from io import BytesIO
from pathlib import Path
from typing import Dict, Tuple

from PIL import Image

from ..config import settings
from ..utils.errors import APIError

logger = logging.getLogger(__name__)


def _ensure_model_in_cache(model_id: str) -> Path:
    """Ensure the requested model is present in the local cache directory.

    If the model file does not exist, this function will attempt to download it
    from TF Hub using the same convention as the cartoonizer package:
    https://tfhub.dev/<publisher>/lite-model/<model>/<variant>/<version>?lite-format=tflite
    """
    cache_dir = settings.model_cache_dir
    cache_dir.mkdir(parents=True, exist_ok=True)

    try:
        from cartoonizer.constants import REGISTERED_MODELS, TFHUB_BASE_URL  # type: ignore[import]
    except ImportError as exc:  # noqa: PERF203
        raise APIError(
            "Local cartoonization is not configured. Install the 'cartoonizer' package "
            "and its dependencies to enable local mode.",
            status_code=500,
        ) from exc

    if model_id not in REGISTERED_MODELS:
        raise APIError(f"Unknown local model_id: {model_id}", status_code=500)

    entry = REGISTERED_MODELS[model_id]
    model_path = cache_dir / f"{entry.model_id}.tflite"
    if model_path.is_file():
        return model_path

    # Download from TF Hub into the cache directory.
    import requests  # type: ignore[import]

    url = f"{TFHUB_BASE_URL}/{entry.tfhub_id}?lite-format=tflite"
    logger.info(
        "Downloading local model",
        extra={"url": url, "destination": str(model_path)},
    )
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with model_path.open("wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if not chunk:
                    continue
                f.write(chunk)

    logger.info("Local model downloaded", extra={"destination": str(model_path)})
    return model_path


def run_cartoonize_local(
    image_bytes: bytes, model_variant: str
) -> Tuple[bytes, Dict[str, float]]:
    """Run local CPU cartoonization using a cached TFLite model.

    Returns PNG bytes and latency metrics.
    """
    start_total = time.perf_counter()

    try:
        import numpy as np  # type: ignore[import]

        from cartoonizer.constants import MODEL_PROFILE_DEFAULT  # type: ignore[import]
        from cartoonizer.postprocess import postprocess_image  # type: ignore[import]
        from cartoonizer.preprocess import preprocess_image  # type: ignore[import]
        from cartoonizer.tflite_runner import TFLiteRunner  # type: ignore[import]
    except ImportError as exc:  # noqa: PERF203
        raise APIError(
            "Local cartoonization is not configured. Install the 'cartoonizer' package "
            "and its runtime dependencies (numpy, pillow, opencv, tflite-runtime or tensorflow).",
            status_code=500,
        ) from exc

    # Decode input image
    pil_image = Image.open(BytesIO(image_bytes)).convert("RGB")
    input_array = np.array(pil_image, dtype=np.uint8)

    model_id = "cartoongan-fp16" if model_variant == "fp16" else "cartoongan-int8"
    model_path = _ensure_model_in_cache(model_id)

    runner = TFLiteRunner(model_path)
    preprocess_start = time.perf_counter()
    preprocess_result = preprocess_image(
        image=input_array,
        profile=MODEL_PROFILE_DEFAULT,
        max_size=MODEL_PROFILE_DEFAULT.input_size,
        resize_mode="fit",
        force_bgr=True,
    )
    preprocess_ms = (time.perf_counter() - preprocess_start) * 1000.0

    inference_start = time.perf_counter()
    output_tensor = runner.run(preprocess_result.tensor)
    inference_ms = (time.perf_counter() - inference_start) * 1000.0

    postprocess_start = time.perf_counter()
    postprocess_result = postprocess_image(
        output_tensor=output_tensor,
        profile=MODEL_PROFILE_DEFAULT,
        target_size=input_array.shape[:2],
        from_bgr=True,
    )
    postprocess_ms = (time.perf_counter() - postprocess_start) * 1000.0

    # Encode to PNG
    output_image = Image.fromarray(postprocess_result.image)
    buffer = BytesIO()
    output_image.save(buffer, format="PNG")
    png_bytes = buffer.getvalue()

    total_ms = (time.perf_counter() - start_total) * 1000.0

    metrics: Dict[str, float] = {
        "preprocess_ms": preprocess_ms,
        "inference_ms": inference_ms,
        "postprocess_ms": postprocess_ms,
        "total_ms": total_ms,
    }

    logger.info(
        "Local cartoonization completed",
        extra={
            "mode": "local",
            "variant": model_variant,
            "preprocess_ms": preprocess_ms,
            "inference_ms": inference_ms,
            "postprocess_ms": postprocess_ms,
            "total_ms": total_ms,
        },
    )

    return png_bytes, metrics
