from __future__ import annotations

import logging
import time
from typing import Dict, Tuple

from ..config import settings
from ..utils.errors import APIError

logger = logging.getLogger(__name__)


def run_cartoonize_cloud(
    image_bytes: bytes,
    model_variant: str,
    ip_token: str | None,
) -> Tuple[bytes, Dict[str, float]]:
    """Call a remote Gradio Space for cartoonization.

    This uses `gradio_client.Client` under the hood. The exact API contract
    depends on the deployed Space; this function assumes a standard interface
    where the Space exposes an API (default `/predict`) that accepts an image
    and a model variant, and returns a cartoonized image.
    """
    if not settings.gradio_space_id:
        raise APIError(
            "Cloud cartoonization is not configured. Set GRADIO_SPACE_ID to enable cloud mode.",
            status_code=500,
        )

    try:
        from gradio_client import Client  # type: ignore[import]
    except ImportError as exc:  # noqa: PERF203
        raise APIError(
            "Cloud cartoonization requires 'gradio_client'. Install it in the backend environment.",
            status_code=500,
        ) from exc

    client = Client(settings.gradio_space_id)
    headers: Dict[str, str] = {}
    if ip_token:
        # Forward optional ZeroGPU token if present
        headers["x-ip-token"] = ip_token

    total_start = time.perf_counter()
    last_error: Exception | None = None
    result_bytes: bytes | None = None

    # Simple retry loop
    for attempt in range(2):
        try:
            # The exact signature depends on the Space implementation.
            # We assume the API returns PNG bytes.
            result = client.predict(
                image_bytes,
                model_variant,
                api_name=settings.gradio_api_name,
                headers=headers or None,
            )
            if isinstance(result, bytes):
                result_bytes = result
            elif isinstance(result, str):
                # Some Spaces may return base64 or a path; this can be adapted as needed.
                result_bytes = result.encode("utf-8")
            else:
                raise RuntimeError("Unexpected response type from Gradio Space")
            last_error = None
            break
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            logger.warning(
                "Cloud cartoonization attempt failed",
                extra={"attempt": attempt + 1, "mode": "cloud", "variant": model_variant},
            )

    if last_error is not None or result_bytes is None:
        logger.exception(
            "Cloud cartoonization failed",
            exc_info=last_error,
        )
        raise APIError("Cloud cartoonization failed", status_code=502)

    total_ms = (time.perf_counter() - total_start) * 1000.0
    metrics: Dict[str, float] = {
        "total_ms": total_ms,
    }

    logger.info(
        "Cloud cartoonization completed",
        extra={
            "mode": "cloud",
            "variant": model_variant,
            "total_ms": total_ms,
        },
    )
    return result_bytes, metrics