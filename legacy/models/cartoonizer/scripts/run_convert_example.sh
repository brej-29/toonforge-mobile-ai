#!/usr/bin/env bash
#
# Example script to convert a SavedModel to TFLite variants using the
# cartoonizer CLI.
#
# This script prints usage and an example command. Adjust paths and
# uncomment the example to run it.

set -euo pipefail

echo "Cartoonizer convert example"
echo "Usage (local SavedModel dir):"
echo "  cd models/cartoonizer"
echo "  python -m cartoonizer convert \\"
echo "    --savedmodel /path/to/saved_model \\"
echo "    --out_dir ../artifacts/converted/my_cartoongan \\"
echo "    --variants fp32,fp16,int8 \\"
echo "    --representative_data_dir /path/to/representative/images"
echo ""
echo "Usage (Hugging Face model ID):"
echo "  python -m cartoonizer convert \\"
echo "    --savedmodel my-org/cartoonizer-savedmodel \\"
echo "    --out_dir ../artifacts/converted/my_cartoongan \\"
echo "    --variants fp32,fp16,int8"
echo ""

# Example (commented out by default):
# cd \"$(dirname \"$0\")/..\"
# python -m cartoonizer convert \
#   --savedmodel /path/to/saved_model \
#   --out_dir ../artifacts/converted/my_cartoongan \
#   --variants fp32,fp16,int8