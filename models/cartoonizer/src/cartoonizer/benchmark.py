from __future__ import annotations

import json
import logging
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List

import numpy as np

from .constants import BENCHMARKS_DIR, MODEL_PROFILE_DEFAULT, ensure_artifact_dirs
from .io_images import load_image
from .preprocess import preprocess_image
from .tflite_runner import TFLiteRunner

logger = logging.getLogger(__name__)


def _percentile(values: List[float], p: float) -> float:
    if not values:
        return float("nan")
    k = (len(values) - 1) * (p / 100.0)
    f = int(np.floor(k))
    c = int(np.ceil(k))
    if f == c:
        return values[f]
    d0 = values[f] * (c - k)
    d1 = values[c] * (k - f)
    return d0 + d1


def benchmark_model(
    model_path: Path,
    input_path: Path,
    runs: int,
    warmup: int,
) -> Path:
    """Benchmark a TFLite model and write a JSON report."""
    ensure_artifact_dirs()
    image = load_image(input_path)
    runner = TFLiteRunner(model_path)
    expected_hw = runner.get_expected_hw(fallback=MODEL_PROFILE_DEFAULT.input_size)
    if expected_hw is not None:
        max_size = expected_hw[0]
    else:
        max_size = MODEL_PROFILE_DEFAULT.input_size

    preprocess_result = preprocess_image(
        image=image,
        profile=MODEL_PROFILE_DEFAULT,
        max_size=max_size,
        resize_mode="fit",
        force_bgr=True,
    )

    # Warmup runs
    for _ in range(warmup):
        _ = runner.run(preprocess_result.tensor)

    # Timed runs
    times_ms: List[float] = []
    for _ in range(runs):
        start = time.perf_counter()
        _ = runner.run(preprocess_result.tensor)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        times_ms.append(elapsed_ms)

    times_ms_sorted = sorted(times_ms)
    p50 = _percentile(times_ms_sorted, 50.0)
    p95 = _percentile(times_ms_sorted, 95.0)
    mean = statistics.fmean(times_ms_sorted) if times_ms_sorted else float("nan")
    stdev = statistics.pstdev(times_ms_sorted) if len(times_ms_sorted) > 1 else 0.0

    model_size = model_path.stat().st_size

    report = {
        "model_path": str(model_path),
        "input_path": str(input_path),
        "runs": runs,
        "warmup": warmup,
        "latency_ms": {
            "p50": p50,
            "p95": p95,
            "mean": mean,
            "stdev": stdev,
        },
        "model_size_bytes": model_size,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    BENCHMARKS_DIR.mkdir(parents=True, exist_ok=True)
    report_name = model_path.stem + "_benchmark.json"
    report_path = BENCHMARKS_DIR / report_name
    report_path.write_text(json.dumps(report, indent=2))

    logger.info(
        "Benchmark completed",
        extra={
            "model_path": str(model_path),
            "runs": runs,
            "warmup": warmup,
            "p50_ms": p50,
            "p95_ms": p95,
            "mean_ms": mean,
            "stdev_ms": stdev,
            "report_path": str(report_path),
        },
    )

    return report_path


def cli(args) -> int:
    """CLI handler for `benchmark` command."""
    model_path = Path(args.model)
    input_path = Path(args.input)
    runs = int(args.runs)
    warmup = int(args.warmup)

    try:
        benchmark_model(model_path=model_path, input_path=input_path, runs=runs, warmup=warmup)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Benchmark failed", exc_info=exc)
        return 1

    return 0