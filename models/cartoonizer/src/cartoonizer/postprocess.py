from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Optional, Tuple

import cv2
import numpy as np

from .constants import ModelProfile


@dataclass
class PostprocessResult:
    image: np.ndarray
    elapsed_ms: float


def postprocess_image(
    output_tensor: np.ndarray,
    profile: ModelProfile,
    target_size: Optional[Tuple[int, int]] = None,
    from_bgr: bool = True,
) -> PostprocessResult:
    """Postprocess the output of a CartoonGAN-style TFLite model.

    Assumes:
    - output_tensor has shape (1, H, W, 3)
    - Values are in [profile.normalize_min, profile.normalize_max], typically [-1, 1].

    Steps:
    - Remove batch dimension.
    - De-normalize to [0, 255].
    - Optionally convert BGR -> RGB.
    - Resize back to `target_size` if provided.
    """
    if output_tensor.ndim != 4 or output_tensor.shape[0] != 1:
        raise ValueError(f"Expected output tensor with shape (1, H, W, 3), got {output_tensor.shape}")

    start = time.perf_counter()

    img = output_tensor[0]

    min_val = profile.normalize_min
    max_val = profile.normalize_max
    img = (img - min_val) / (max_val - min_val)
    img = img * 255.0
    img = np.clip(img, 0.0, 255.0).astype("uint8")

    if from_bgr:
        img = img[:, :, ::-1]  # BGR -> RGB

    if target_size is not None:
        target_h, target_w = target_size
        img = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_CUBIC)

    elapsed_ms = (time.perf_counter() - start) * 1000.0
    return PostprocessResult(image=img, elapsed_ms=elapsed_ms)