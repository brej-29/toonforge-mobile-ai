from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


def _import_interpreter() -> Any:
    """Import a TFLite Interpreter, preferring tflite-runtime.

    Returns the Interpreter class or raises a RuntimeError with a clear message.

    On modern TensorFlow versions (e.g. 2.20+), the recommended entrypoint is
    ``tf.lite.Interpreter`` rather than ``from tensorflow.lite import Interpreter``.
    This helper handles both layouts.
    """
    # 1) Try lightweight tflite-runtime first
    try:
        from tflite_runtime.interpreter import Interpreter  # type: ignore[import]

        logger.info("Using tflite-runtime Interpreter")
        return Interpreter
    except ImportError:
        logger.info("tflite-runtime not available, trying TensorFlow Lite interpreter")

    # 2) Fallback to TensorFlow Lite
    try:
        import tensorflow as tf  # type: ignore[import]

        # Prefer the public attribute if available
        Interpreter = getattr(tf.lite, "Interpreter", None)
        if Interpreter is None:
            # Older layouts exposed the class from a submodule
            from tensorflow.lite.python.interpreter import (  # type: ignore[import]
                Interpreter,
            )

        logger.info("Using TensorFlow Lite Interpreter")
        return Interpreter
    except (ImportError, AttributeError) as exc:  # noqa: PERF203
        raise RuntimeError(
            "No TFLite interpreter available. Install either 'tflite-runtime' "
            "or 'tensorflow' to run inference."
        ) from exc


@dataclass
class TFLiteModelInfo:
    input_shape: List[int]
    input_dtype: str
    output_shape: List[int]
    output_dtype: str


class TFLiteRunner:
    """Thin wrapper around a TFLite interpreter."""

    def __init__(self, model_path: Path, require_float32: bool = True) -> None:
        self.model_path = model_path
        Interpreter = _import_interpreter()
        self.interpreter = Interpreter(model_path=str(model_path))
        self.interpreter.allocate_tensors()

        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

        if len(self.input_details) != 1 or len(self.output_details) != 1:
            raise ValueError(
                f"Expected single input and output tensor, got "
                f"{len(self.input_details)} inputs and {len(self.output_details)} outputs"
            )

        self._validate_input_type(require_float32=require_float32)

    def _validate_input_type(self, require_float32: bool) -> None:
        input_dtype = self.input_details[0]["dtype"]
        if require_float32 and input_dtype != np.float32:
            raise ValueError(
                f"Expected input tensor dtype float32, got {input_dtype}. "
                "Adjust preprocessing or extend TFLiteRunner to support additional dtypes."
            )

    @property
    def model_info(self) -> TFLiteModelInfo:
        input_detail = self.input_details[0]
        output_detail = self.output_details[0]
        return TFLiteModelInfo(
            input_shape=list(input_detail["shape"]),
            input_dtype=str(input_detail["dtype"]),
            output_shape=list(output_detail["shape"]),
            output_dtype=str(output_detail["dtype"]),
        )

    def get_expected_hw(self, fallback: int) -> Optional[tuple[int, int]]:
        """Return expected (H, W) if encoded in the model, else None.

        If the model has dynamic dimensions (0 or -1), None is returned and
        the caller should use a fallback (such as CLI-provided max_size).
        """
        shape = self.model_info.input_shape
        if len(shape) != 4:
            return None
        _, h, w, c = shape
        if c != 3:
            logger.warning("Unexpected input channels for model: %s", shape)
        if h <= 0 or w <= 0:
            return None
        if h != w:
            logger.info(
                "Non-square model input (%s), using height/width from model", shape
            )
        if h > 0 and w > 0:
            return int(h), int(w)
        return None

    def run(self, input_tensor: np.ndarray) -> np.ndarray:
        """Run inference.

        Expects input_tensor shape compatible with the model (1, H, W, 3).
        """
        if input_tensor.ndim != 4:
            raise ValueError(
                f"Expected input tensor with 4 dimensions, got {input_tensor.shape}"
            )

        input_index = self.input_details[0]["index"]
        self.interpreter.set_tensor(input_index, input_tensor)
        self.interpreter.invoke()
        output_index = self.output_details[0]["index"]
        output_data = self.interpreter.get_tensor(output_index)
        return output_data
