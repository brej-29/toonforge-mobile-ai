from __future__ import annotations

from pathlib import Path
from typing import Union

import numpy as np
from PIL import Image

PathLike = Union[str, Path]


def load_image(path: PathLike) -> np.ndarray:
    """Load an image as an RGB uint8 NumPy array (H, W, 3)."""
    image_path = Path(path)
    if not image_path.is_file():
        raise FileNotFoundError(f"Input image not found: {image_path}")

    with Image.open(image_path) as img:
        img = img.convert("RGB")
        arr = np.array(img, dtype=np.uint8)
    if arr.ndim != 3 or arr.shape[2] != 3:
        raise ValueError(f"Expected RGB image with 3 channels, got shape {arr.shape}")
    return arr


def save_image(image: np.ndarray, path: PathLike) -> None:
    """Save an RGB uint8 NumPy array (H, W, 3) to disk."""
    if image.ndim != 3 or image.shape[2] != 3:
        raise ValueError(f"Expected image with shape (H, W, 3), got {image.shape}")
    if image.dtype != np.uint8:
        raise ValueError(f"Expected image dtype uint8, got {image.dtype}")

    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.fromarray(image, mode="RGB")
    img.save(output_path)
