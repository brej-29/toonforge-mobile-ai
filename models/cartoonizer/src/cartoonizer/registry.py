from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from .constants import REGISTERED_MODELS, RegistryEntry


@dataclass
class RegistryPublicEntry:
    model_id: str
    name: str
    description: str
    tfhub_url: str
    variant: str
    input_size: int
    force_bgr: bool


def list_models() -> List[RegistryPublicEntry]:
    """Return a list of public registry entries."""
    entries: Dict[str, RegistryEntry] = REGISTERED_MODELS
    public: List[RegistryPublicEntry] = []
    for entry in entries.values():
        tfhub_url = f"https://tfhub.dev/{entry.tfhub_id}?lite-format=tflite"
        public.append(
            RegistryPublicEntry(
                model_id=entry.model_id,
                name=entry.name,
                description=entry.description,
                tfhub_url=tfhub_url,
                variant=entry.variant,
                input_size=entry.profile.input_size,
                force_bgr=entry.profile.force_bgr,
            )
        )
    return public


def get_model(model_id: str) -> RegistryEntry:
    try:
        return REGISTERED_MODELS[model_id]
    except KeyError as exc:  # noqa: PERF203
        raise KeyError(
            f"Unknown model_id: {model_id}. Known IDs: {list(REGISTERED_MODELS.keys())}"
        ) from exc
