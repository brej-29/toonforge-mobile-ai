from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import requests

from .constants import DOWNLOADED_DIR, TFHUB_BASE_URL, ensure_artifact_dirs
from .registry import get_model, list_models

logger = logging.getLogger(__name__)


def _sha256_file(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _download_file(url: str, dest: Path) -> int:
    logger.info("Downloading model", extra={"url": url, "destination": str(dest)})
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        bytes_written = 0
        with dest.open("wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if not chunk:
                    continue
                f.write(chunk)
                bytes_written += len(chunk)
    logger.info(
        "Download complete", extra={"destination": str(dest), "bytes": bytes_written}
    )
    return bytes_written


def _write_metadata(
    path: Path,
    url: str,
    size_bytes: int,
    checksum: str,
) -> None:
    sidecar = path.with_suffix(path.suffix + ".json")
    sidecar_data = {
        "source_url": url,
        "sha256": checksum,
        "size_bytes": size_bytes,
        "downloaded_at": datetime.now(timezone.utc).isoformat(),
    }
    sidecar.write_text(json.dumps(sidecar_data, indent=2))
    logger.info("Wrote metadata", extra={"metadata_path": str(sidecar)})


def download_model_ids(model_ids: Iterable[str]) -> None:
    ensure_artifact_dirs()
    for model_id in model_ids:
        entry = get_model(model_id)
        url = f"{TFHUB_BASE_URL}/{entry.tfhub_id}?lite-format=tflite"
        dest = DOWNLOADED_DIR / f"{entry.model_id}.tflite"

        size_bytes = _download_file(url, dest)
        checksum = _sha256_file(dest)
        _write_metadata(dest, url, size_bytes, checksum)


def cli(args) -> int:
    """CLI handler for `download` command."""
    if args.model_id == "all":
        model_ids = [m.model_id for m in list_models()]
    else:
        model_ids = [args.model_id]

    try:
        download_model_ids(model_ids)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to download models", exc_info=exc)
        return 1

    return 0
