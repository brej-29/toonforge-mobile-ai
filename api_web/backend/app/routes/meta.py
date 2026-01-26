from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from ..config import settings

router = APIRouter(tags=["meta"])


class VersionResponse(BaseModel):
    version: str
    api_version: str
    git_sha: Optional[str]


class ModelMode(BaseModel):
    id: str
    description: str


class ModelVariant(BaseModel):
    id: str
    description: str


class ModelsResponse(BaseModel):
    modes: List[ModelMode]
    variants: List[ModelVariant]


@router.get("/version", response_model=VersionResponse)
def version() -> VersionResponse:
    """Return application and API version metadata."""
    return VersionResponse(
        version=settings.version,
        api_version=settings.api_version,
        git_sha=settings.git_sha,
    )


@router.get("/v1/models", response_model=ModelsResponse)
def list_models() -> ModelsResponse:
    """List supported cartoonization modes and model variants."""
    modes = [
        ModelMode(id="local", description="Local CPU TFLite inference using cached models."),
        ModelMode(
            id="cloud",
            description="Cloud inference via Gradio Space using gradio_client (ZeroGPU optional).",
        ),
    ]
    variants = [
        ModelVariant(id="fp16", description="Float16-optimized TFLite model."),
        ModelVariant(id="int8", description="Int8-quantized TFLite model (smaller, faster)."),
    ]
    return ModelsResponse(modes=modes, variants=variants)