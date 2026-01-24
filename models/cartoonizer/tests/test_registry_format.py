from __future__ import annotations

from cartoonizer.constants import REGISTERED_MODELS
from cartoonizer.registry import list_models


def test_registered_models_non_empty() -> None:
    assert REGISTERED_MODELS, "Expected at least one registered model"


def test_public_registry_entries_have_expected_fields() -> None:
    entries = list_models()
    assert entries, "Expected non-empty public registry entries"

    for entry in entries:
        assert entry.model_id
        assert entry.name
        assert entry.tfhub_url.startswith("https://tfhub.dev/")
        assert entry.input_size > 0