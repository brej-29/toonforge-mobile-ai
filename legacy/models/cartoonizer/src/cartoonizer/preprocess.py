from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Tuple

import cv2
import numpy as np

from .constants import ModelProfile


@dataclass
class PreprocessResult:
    tensor: np.ndarray
    new_size: Tuple[int, int]  # (height, width)
    elapsed_ms: float


def _resize_image(
    image: np.ndarray,
    target_size: Tuple[int, int],
    resize_mode: str,
) -> np.ndarray:
    """Resize image to target_size while applying selected mode.

    - 'fit': resize to target_size exactly (no padding for simplicity).
    - 'crop': center-crop after resizing the shorter side to target_size.
    """
    target_h, target_w = target_size
    h, w, _ = image.shape

    if resize_mode == "fit":
        resized = cv2.resize(image, (target_w, target_h), interpolation=cv2.INTER_AREA)
        return resized

    # crop mode: scale shortest side, then center-crop
    scale = max(target_h / h, target_w / w)
    new_h = int(round(h * scale))
    new_w = int(round(w * scale))
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

    top = max((new_h - target_h) // 2, 0)
    left = max((new_w - target_w) // 2, 0)
    bottom = top + target_h
    right = left + target_w

    return resized[top:bottom, left:right, :]


def preprocess_image(
    image: np.ndarray,
    profile: ModelProfile,
    max_size: int,
    resize_mode: str = "fit",
    force_bgr: bool = True,
) -> PreprocessResult:
    """Preprocess an RGB uint8 image for a CartoonGAN-style TFLite model.

    Steps:
    - Resize to a square close to `profile.input_size`, bounded by `max_size`.
    - Optionally convert RGB -> BGR.
    - Normalize to [profile.normalize_min, profile.normalize_max].
    - Add batch dimension and cast to float32.

    Returns the tensor and timing information.
    """
    if image.ndim != 3 or image.shape[2] != 3:
        raise ValueError(f"Expected RGB image with shape (H, W, 3), got {image.shape}")

    start = time.perf_counter()

    # Determine target size (square)
    target_size = min(profile.input_size, max_size)
    target_h = target_w = target_size

    resized = _resize_image(image, (target_h, target_w), resize_mode=resize_mode)

    if force_bgr:
        resized = resized[:, :, ::-1]  # RGB -> BGR

    img_float = resized.astype("float32")
    # Normalize to [min, max], typically [-1, 1]
    min_val = profile.normalize_min
    max_val = profile.normalize_max
    img_float = img_float / 255.0
    img_float = img_float * (max_val - min_val) + min_val

    tensor = np.expand_dims(img_float, axis=0)  # (1, H, W, 3)

    elapsed_ms = (time.perf_counter() - start) * 1000.0
    return PreprocessResult(
        tensor=tensor, new_size=(target_h, target_w), elapsed_ms=elapsed_ms
    )
