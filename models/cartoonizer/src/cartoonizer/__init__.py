"""
Cartoonizer model pipeline CLI.

Provides:
- Download of TFLite models from TF Hub.
- Local inference on images with TFLite.
- Benchmarking of models.
- SavedModel -> TFLite conversion and quantization.

Use via:

    python -m cartoonizer <command> [options]
"""

from __future__ import annotations

from typing import Callable, List, Optional

from .logging_config import setup_logging
from . import benchmark as benchmark_cmd
from . import convert_savedmodel as convert_cmd
from . import download as download_cmd
from . import infer as infer_cmd

import argparse
import logging

logger = logging.getLogger(__name__)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m cartoonizer",
        description="Cartoonizer model pipeline (download, inference, benchmarking, conversion).",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # download
    download_parser = subparsers.add_parser(
        "download",
        help="Download prebuilt TFLite models from TF Hub.",
    )
    download_parser.add_argument(
        "--model-id",
        type=str,
        default="all",
        help="Model ID to download (e.g. cartoongan-fp16, cartoongan-int8, or 'all').",
    )
    download_parser.set_defaults(func=download_cmd.cli)

    # infer
    infer_parser = subparsers.add_parser(
        "infer",
        help="Run inference on a local image with a TFLite model.",
    )
    infer_parser.add_argument("--model", type=str, required=True, help="Path to TFLite model.")
    infer_parser.add_argument("--input", type=str, required=True, help="Path to input image.")
    infer_parser.add_argument("--output", type=str, required=True, help="Path to output image.")
    infer_parser.add_argument(
        "--max_size",
        type=int,
        default=720,
        help="Maximum size (pixels) for the larger image dimension (default: 720).",
    )
    infer_parser.add_argument(
        "--force_bgr",
        type=str,
        default="true",
        help="Whether to convert RGB to BGR before inference (true/false, default: true).",
    )
    infer_parser.add_argument(
        "--resize_mode",
        type=str,
        choices=["fit", "crop"],
        default="fit",
        help="Resize mode: 'fit' to keep aspect ratio, 'crop' to center-crop (default: fit).",
    )
    infer_parser.set_defaults(func=infer_cmd.cli)

    # benchmark
    benchmark_parser = subparsers.add_parser(
        "benchmark",
        help="Benchmark a TFLite model (latency, size).",
    )
    benchmark_parser.add_argument("--model", type=str, required=True, help="Path to TFLite model.")
    benchmark_parser.add_argument("--input", type=str, required=True, help="Path to input image.")
    benchmark_parser.add_argument(
        "--runs",
        type=int,
        default=50,
        help="Number of timed runs (default: 50).",
    )
    benchmark_parser.add_argument(
        "--warmup",
        type=int,
        default=5,
        help="Number of warmup runs (default: 5).",
    )
    benchmark_parser.set_defaults(func=benchmark_cmd.cli)

    # convert
    convert_parser = subparsers.add_parser(
        "convert",
        help="Convert a SavedModel to TFLite variants (fp32, fp16, int8).",
    )
    convert_parser.add_argument(
        "--savedmodel",
        type=str,
        required=True,
        help="SavedModel source: local path or Hugging Face model ID.",
    )
    convert_parser.add_argument(
        "--out_dir",
        type=str,
        required=True,
        help="Output directory under models/artifacts/converted/ for variants.",
    )
    convert_parser.add_argument(
        "--variants",
        type=str,
        default="fp32,fp16,int8",
        help="Comma-separated list of variants to generate (fp32,fp16,int8).",
    )
    convert_parser.add_argument(
        "--representative_data_dir",
        type=str,
        default="",
        help="Optional directory of images for full integer quantization (int8).",
    )
    convert_parser.set_defaults(func=convert_cmd.cli)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    """Entry point used by `python -m cartoonizer`."""
    setup_logging()
    parser = build_parser()

    try:
        args = parser.parse_args(argv)
    except SystemExit as exc:
        # argparse will raise SystemExit for --help and parse errors.
        return int(exc.code)

    func: Callable[[argparse.Namespace], int] = getattr(args, "func", None)
    if func is None:
        parser.print_help()
        return 1

    try:
        return func(args)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled error in cartoonizer CLI", exc_info=exc)
        return 1