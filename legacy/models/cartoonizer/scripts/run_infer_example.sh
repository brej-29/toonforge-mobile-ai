#!/usr/bin/env bash
#
# Example script to run inference with the cartoonizer CLI.
#
# This script is intentionally conservative: it prints usage and an example
# command rather than running a full pipeline by default. Adjust paths and
# uncomment the example to run it.

set -euo pipefail

echo "Cartoonizer inference example"
echo "Usage:"
echo "  cd models/cartoonizer"
echo "  python -m cartoonizer infer \\"
echo "    --model ../artifacts/downloaded/cartoongan-fp16.tflite \\"
echo "    --input /path/to/input.jpg \\"
echo "    --output /path/to/output_cartoon.jpg \\"
echo "    --max_size 720 \\"
echo "    --force_bgr true \\"
echo "    --resize_mode fit"
echo ""

# Example (commented out by default):
# cd \"$(dirname \"$0\")/..\"
# python -m cartoonizer infer \
#   --model ../artifacts/downloaded/cartoongan-fp16.tflite \
#   --input ./example_input.jpg \
#   --output ./example_output.jpg \
#   --max_size 720 \
#   --force_bgr true \
#   --resize_mode fit