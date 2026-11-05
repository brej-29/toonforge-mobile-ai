from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from .constants import ensure_artifact_dirs
from .quantize import convert_fp16, convert_fp32, convert_int8
from .tflite_runner import TFLiteRunner, TFLiteModelInfo

logger = logging.getLogger(__name__)


def _import_hf_hub():
    try:
        from huggingface_hub import snapshot_download  # type: ignore[import]

        return snapshot_download
    except ImportError as exc:  # noqa: PERF203
        raise RuntimeError(
            "huggingface_hub is required to use a HF model ID as SavedModel source. "
            "Install it with:\n"
            "  pip install huggingface_hub\n"
        ) from exc


@dataclass
class VariantMetadata:
    variant: str
    path: str
    size_bytes: int
    sha256: str
    model_info: TFLiteModelInfo
    options: Dict[str, str]
    created_at: str


def _sha256_bytes(data: bytes) -> str:
    hasher = hashlib.sha256()
    hasher.update(data)
    return hasher.hexdigest()


def _sha256_file(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _resolve_savedmodel_source(source: str) -> Path:
    path = Path(source).expanduser()
    if path.exists():
        return path.resolve()

    # Treat as Hugging Face model ID
    snapshot_download = _import_hf_hub()
    logger.info(
        "Downloading SavedModel from Hugging Face Hub", extra={"model_id": source}
    )
    repo_dir = Path(snapshot_download(repo_id=source))
    # Heuristic: SavedModel directory named "saved_model" or "saved_model.pb" present.
    for candidate in [repo_dir, repo_dir / "saved_model"]:
        if (candidate / "saved_model.pb").exists():
            return candidate
    raise FileNotFoundError(
        f"Could not locate SavedModel in HF repo '{source}'. "
        "Expected a directory containing 'saved_model.pb'."
    )


def _write_variant_metadata(meta: VariantMetadata, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = out_dir / f"{Path(meta.path).stem}_metadata.json"
    metadata_path.write_text(json.dumps(asdict(meta), indent=2))
    logger.info("Wrote variant metadata", extra={"metadata_path": str(metadata_path)})


def _inspect_tflite_model(path: Path) -> TFLiteModelInfo:
    # When inspecting converted models (including int8 variants), we do not
    # require float32 input dtype.
    runner = TFLiteRunner(path, require_float32=False)
    return runner.model_info


def convert_savedmodel_variants(
    savedmodel_source: str,
    out_dir: Path,
    variants: List[str],
    representative_data_dir: Optional[Path] = None,
) -> None:
    ensure_artifact_dirs()
    savedmodel_dir = _resolve_savedmodel_source(savedmodel_source)

    out_dir.mkdir(parents=True, exist_ok=True)
    logger.info(
        "Converting SavedModel to TFLite variants",
        extra={
            "savedmodel_dir": str(savedmodel_dir),
            "out_dir": str(out_dir),
            "variants": ",".join(variants),
        },
    )

    for variant in variants:
        variant = variant.lower()
        output_path = out_dir / f"model_{variant}.tflite"

        if variant == "fp32":
            convert_fp32(savedmodel_dir, output_path)
            options = {"optimization": "none", "inference_type": "float32"}
        elif variant == "fp16":
            convert_fp16(savedmodel_dir, output_path)
            options = {"optimization": "Optimize.DEFAULT", "inference_type": "float16"}
        elif variant == "int8":
            convert_int8(
                saved_model_dir=savedmodel_dir,
                output_path=output_path,
                representative_data_dir=representative_data_dir,
            )
            options = {
                "optimization": "Optimize.DEFAULT",
                "inference_type": "int8",
                "representative_data_dir": (
                    str(representative_data_dir) if representative_data_dir else ""
                ),
            }
        else:
            raise ValueError(
                f"Unknown variant: {variant}. Expected one of: fp32, fp16, int8."
            )

        model_info = _inspect_tflite_model(output_path)
        size_bytes = output_path.stat().st_size
        checksum = _sha256_file(output_path)
        created_at = datetime.now(timezone.utc).isoformat()

        metadata = VariantMetadata(
            variant=variant,
            path=str(output_path),
            size_bytes=size_bytes,
            sha256=checksum,
            model_info=model_info,
            options=options,
            created_at=created_at,
        )
        _write_variant_metadata(metadata, out_dir)

    logger.info("Conversion completed", extra={"out_dir": str(out_dir)})


def cli(args) -> int:
    """CLI handler for `convert` command."""
    savedmodel_source = args.savedmodel
    out_dir = Path(args.out_dir).expanduser().resolve()
    variants = [v.strip() for v in args.variants.split(",") if v.strip()]
    representative_data_dir = (
        Path(args.representative_data_dir).expanduser()
        if args.representative_data_dir
        else None
    )

    try:
        convert_savedmodel_variants(
            savedmodel_source=savedmodel_source,
            out_dir=out_dir,
            variants=variants,
            representative_data_dir=representative_data_dir,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Conversion failed", exc_info=exc)
        return 1

    return 0
