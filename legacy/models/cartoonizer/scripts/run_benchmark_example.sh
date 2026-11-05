#!/usr/bin/env bash
#
# Example script to benchmark a TFLite model with the cartoonizer CLI.
#
# This script prints usage and an example command. Adjust paths and
# uncomment the example to run it.

set -euo pipefail

echo "Cartoonizer benchmark example"
echo "Usage:"
echo "  cd models/cartoonizer"
echo "  python -m cartoonizer benchmark \\"
echo "    --model ../artifacts/downloaded/cartoongan-fp16.tflite \\"
echo "    --input /path/to/input.jpg \\"
echo "    --runs 50 \\"
echo "    --warmup 5"
echo ""

# Example (commented out by default):
# cd \"$(dirname \"$0\")/..\"
# python -m cartoonizer benchmark \
#   --model ../artifacts/downloaded/cartoongan-fp16.tflite \
#   --input ./example_input.jpg \
#   --runs 50 \
#   --warmup 5