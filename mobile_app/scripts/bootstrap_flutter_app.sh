#!/usr/bin/env bash
#
# Helper script to bootstrap a Flutter app for the Mobile AI Cartoon
# Generation project.
#
# Usage:
#   ./bootstrap_flutter_app.sh my_mobile_app_name
#
# This script requires the Flutter CLI to be installed and available
# on your PATH. It simply calls `flutter create` with the provided app
# name inside the mobile_app/ directory.

set -euo pipefail

APP_NAME="${1:-mobile_ai_cartoon_app}"

echo "Bootstrapping Flutter app '${APP_NAME}' in the current directory..."
flutter create "${APP_NAME}"

echo "Done."
echo "Next steps:"
echo "  1) Open ${APP_NAME}/pubspec.yaml and add dependencies for tflite_flutter and http."
echo "  2) Set up folders for TFLite models and API clients as described in README.md."
echo "  3) Wire the app to the FastAPI backend for cloud-mode cartoonization."