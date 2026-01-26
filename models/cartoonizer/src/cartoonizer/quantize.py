from __future__ import annotations

import logging
from pathlib import Path
from typing import Callable, Iterable, Iterator, Optional

logger = logging.getLogger(__name__)


def _import_tf():
    try:
        import tensorflow as tf  # type: ignore[import]

        return tf
    except ImportError as exc:  # noqa: PERF203
        raise RuntimeError(
            "TensorFlow is required for conversion. Install it with:\n"
            "  pip install tensorflow\n"
        ) from exc


def _representative_dataset_from_dir(
    _tf,
    data_dir: Path,
    input_shape: Iterable[int],
) -> Callable[[], Iterator[list]]:
    """Build a representative dataset generator from images in a directory.

    Uses the standard TFLite signature: yield [input_tensor].
    """
    from .io_images import load_image
    from .preprocess import preprocess_image
    from .constants import MODEL_PROFILE_DEFAULT

    paths = [p for p in data_dir.iterdir() if p.is_file()]
    if not paths:
        raise ValueError(f"No images found in representative_data_dir: {data_dir}")

    _, height, width, _ = input_shape

    def gen() -> Iterator[list]:
        for path in paths:
            img = load_image(path)
            pre = preprocess_image(
                image=img,
                profile=MODEL_PROFILE_DEFAULT,
                max_size=min(height, width),
                resize_mode="fit",
                force_bgr=True,
            )
            yield [pre.tensor.astype("float32")]

    return gen


def convert_fp32(saved_model_dir: Path, output_path: Path) -> bytes:
    tf = _import_tf()
    converter = tf.lite.TFLiteConverter.from_saved_model(str(saved_model_dir))
    tflite_model = converter.convert()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(tflite_model)
    logger.info("Wrote fp32 TFLite model", extra={"path": str(output_path)})
    return tflite_model


def convert_fp16(saved_model_dir: Path, output_path: Path) -> bytes:
    tf = _import_tf()
    converter = tf.lite.TFLiteConverter.from_saved_model(str(saved_model_dir))
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    tflite_model = converter.convert()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(tflite_model)
    logger.info("Wrote fp16 TFLite model", extra={"path": str(output_path)})
    return tflite_model


def convert_int8(
    saved_model_dir: Path,
    output_path: Path,
    representative_data_dir: Optional[Path] = None,
) -> bytes:
    tf = _import_tf()
    converter = tf.lite.TFLiteConverter.from_saved_model(str(saved_model_dir))
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    if representative_data_dir is not None:
        # Full integer quantization with representative dataset
        representative_data_dir = representative_data_dir.expanduser().resolve()
        sample_input_shape = [1, 256, 256, 3]
        converter.representative_dataset = _representative_dataset_from_dir(
            tf=tf,
            data_dir=representative_data_dir,
            input_shape=sample_input_shape,
        )
        converter.inference_input_type = tf.int8
        converter.inference_output_type = tf.int8
        logger.info(
            "Using full integer quantization with representative dataset",
            extra={"representative_data_dir": str(representative_data_dir)},
        )
    else:
        # Dynamic range quantization: no representative dataset.
        logger.info("Using dynamic range int8 quantization (no representative dataset)")

    tflite_model = converter.convert()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(tflite_model)
    logger.info("Wrote int8 TFLite model", extra={"path": str(output_path)})
    return tflite_model
