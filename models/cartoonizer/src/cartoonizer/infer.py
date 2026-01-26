from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Tuple

from .constants import MODEL_PROFILE_DEFAULT
from .io_images import load_image, save_image
from .postprocess import postprocess_image
from .preprocess import preprocess_image
from .tflite_runner import TFLiteRunner

logger = logging.getLogger(__name__)


def _parse_bool(value: str) -> bool:
    return value.lower() in {"1", "true", "yes", "y"}


def run_inference(
    model_path: Path,
    input_path: Path,
    output_path: Path,
    max_size: int,
    resize_mode: str,
    force_bgr_flag: bool,
) -> None:
    """Run the full inference pipeline on a single image."""
    start_total = time.perf_counter()

    image = load_image(input_path)
    logger.info(
        "Loaded input image",
        extra={"input_path": str(input_path), "shape": str(image.shape)},
    )

    runner = TFLiteRunner(model_path)
    expected_hw = runner.get_expected_hw(fallback=MODEL_PROFILE_DEFAULT.input_size)

    if expected_hw is not None:
        target_size: Tuple[int, int] = expected_hw
    else:
        target_size = (MODEL_PROFILE_DEFAULT.input_size, MODEL_PROFILE_DEFAULT.input_size)

    preprocess_result = preprocess_image(
        image=image,
        profile=MODEL_PROFILE_DEFAULT,
        max_size=min(max_size, target_size[0]),
        resize_mode=resize_mode,
        force_bgr=force_bgr_flag,
    )

    inference_start = time.perf_counter()
    output_tensor = runner.run(preprocess_result.tensor)
    inference_ms = (time.perf_counter() - inference_start) * 1000.0

    postprocess_result = postprocess_image(
        output_tensor=output_tensor,
        profile=MODEL_PROFILE_DEFAULT,
        target_size=image.shape[:2],
        from_bgr=force_bgr_flag,
    )

    save_image(postprocess_result.image, output_path)

    total_ms = (time.perf_counter() - start_total) * 1000.0

    logger.info(
        "Inference completed",
        extra={
            "model_path": str(model_path),
            "input_shape": str(image.shape),
            "preprocessed_shape": str(preprocess_result.tensor.shape),
            "output_shape": str(postprocess_result.image.shape),
            "preprocess_ms": preprocess_result.elapsed_ms,
            "inference_ms": inference_ms,
            "postprocess_ms": postprocess_result.elapsed_ms,
            "total_ms": total_ms,
        },
    )


def cli(args) -> int:
    """CLI handler for `infer` command."""
    model_path = Path(args.model)
    input_path = Path(args.input)
    output_path = Path(args.output)
    max_size = int(args.max_size)
    resize_mode = args.resize_mode
    force_bgr_flag = _parse_bool(args.force_bgr)

    try:
        run_inference(
            model_path=model_path,
            input_path=input_path,
            output_path=output_path,
            max_size=max_size,
            resize_mode=resize_mode,
            force_bgr_flag=force_bgr_flag,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Inference failed", exc_info=exc)
        return 1

    return 0