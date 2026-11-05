#!/usr/bin/env bash
#
# Copy a TFLite model from models/artifacts/downloaded/ into the Flutter
# app assets directory (mobile_app/toonforge_app/assets/models/).
#
# Usage:
#   ./mobile_app/scripts/copy_model_to_assets.sh cartoongan-fp16.tflite
#
# This script does not download models; use the Python cartoonizer CLI
# first (see models/cartoonizer/README.md).

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <model_filename.tflite>"
  exit 1
fi

MODEL_FILE="$1"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC_DIR="$REPO_ROOT/models/artifacts/downloaded"
DEST_DIR="$REPO_ROOT/mobile_app/toonforge_app/assets/models"

mkdir -p "$DEST_DIR"

if [ ! -f "$SRC_DIR/$MODEL_FILE" ]; then
  echo "Model file not found: $SRC_DIR/$MODEL_FILE"
  echo "Make sure you have downloaded the model using the cartoonizer CLI."
  exit 1
fi

cp "$SRC_DIR/$MODEL_FILE" "$DEST_DIR/"
echo "Copied $MODEL_FILE to $DEST_DIR"