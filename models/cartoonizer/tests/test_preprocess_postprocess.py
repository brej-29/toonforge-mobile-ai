from __future__ import annotations

import numpy as np

from cartoonizer.constants import MODEL_PROFILE_DEFAULT
from cartoonizer.postprocess import postprocess_image
from cartoonizer.preprocess import preprocess_image


def test_preprocess_and_postprocess_roundtrip_rgb() -> None:
    # Create a simple synthetic RGB image
    h, w = 64, 64
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:, :, 0] = 255  # red channel

    pre = preprocess_image(
        image=img,
        profile=MODEL_PROFILE_DEFAULT,
        max_size=64,
        resize_mode="fit",
        force_bgr=True,
    )
    assert pre.tensor.shape[0] == 1
    assert pre.tensor.dtype == np.float32

    post = postprocess_image(
        output_tensor=pre.tensor,
        profile=MODEL_PROFILE_DEFAULT,
        target_size=(h, w),
        from_bgr=True,
    )

    assert post.image.shape == (h, w, 3)
    assert post.image.dtype == np.uint8
