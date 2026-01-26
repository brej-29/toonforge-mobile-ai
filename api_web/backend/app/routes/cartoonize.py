from __future__ import annotations

import logging
from typing import Dict, Literal

from fastapi import APIRouter, File, Form, Header, Request, UploadFile
from fastapi.responses import Response

from ..config import settings
from ..services.cartoonize_cloud import run_cartoonize_cloud
from ..services.cartoonize_local import run_cartoonize_local
from ..utils.errors import APIError

logger = logging.getLogger(__name__)

router = APIRouter(tags=["cartoonize"])


Mode = Literal["local", "cloud"]
Variant = Literal["fp16", "int8"]


@router.post("/v1/cartoonize")
async def cartoonize(
    request: Request,
    mode: Mode = Form("local"),
    model_variant: Variant = Form("fp16"),
    output: str = Form("png"),
    image: UploadFile = File(...),
    x_ip_token: str | None = Header(default=None, alias="x-ip-token"),
) -> Response:
    """Cartoonize an uploaded image using local or cloud inference."""
    if output.lower() != "png":
        raise APIError("Only PNG output is currently supported.", status_code=400)

    if image.content_type is None or not image.content_type.startswith("image/"):
        raise APIError("Uploaded file must be an image.", status_code=400)

    # Enforce max upload size
    body = await image.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(body) > max_bytes:
        raise APIError(
            f"Uploaded file is too large. Max size is {settings.max_upload_mb} MB.",
            status_code=400,
        )

    logger.info(
        "Received cartoonize request",
        extra={
            "mode": mode,
            "variant": model_variant,
            "content_type": image.content_type,
            "size_bytes": len(body),
            "client_host": request.client.host if request.client else None,
        },
    )

    if mode == "local":
        png_bytes, metrics = run_cartoonize_local(body, model_variant)
    else:
        png_bytes, metrics = run_cartoonize_cloud(body, model_variant, ip_token=x_ip_token)

    headers: Dict[str, str] = {
        "x-latency-total-ms": f"{metrics.get('total_ms', 0.0):.2f}",
        "x-mode": mode,
        "x-variant": model_variant,
    }
    if "inference_ms" in metrics:
        headers["x-latency-infer-ms"] = f"{metrics['inference_ms']:.2f}"

    return Response(
        content=png_bytes,
        media_type="image/png",
        headers=headers,
    )