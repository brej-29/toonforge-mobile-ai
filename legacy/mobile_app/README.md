# Mobile app (Flutter)

This directory contains the **Flutter mobile app** for the Mobile AI Cartoon Generation project.

The app is designed to provide:

- An **offline-first** experience using on-device **TFLite** models via `tflite_flutter`.
- An optional **cloud mode** that calls the FastAPI backend for heavier models or future styles.
- A shared user experience with the Streamlit web UI where appropriate.

## Current status (v0.2.0)

- A real Flutter app lives under `mobile_app/toonforge_app/`.
- It includes:
  - A home screen for selecting images, choosing offline/cloud mode, and running cartoonization.
  - Offline TFLite inference (expecting a `.tflite` model in assets, not committed).
  - Cloud mode that calls the FastAPI `/v1/cartoonize` endpoint.
  - A settings screen to configure API base URL, default mode, and model variant.
  - Scripts to copy models from `models/artifacts/downloaded/` into Flutter assets.

## App location

- Main Flutter project: `mobile_app/toonforge_app/`
- Scripts: `mobile_app/scripts/`

See `mobile_app/toonforge_app/README.md` for detailed setup and run instructions.

## Architecture highlights

- **On-device inference**:
  - Uses `tflite_flutter` to run cartoonization models on-device from assets.
  - Models are documented in `models/MODEL_REGISTRY.md` and downloaded/converted via the Python pipeline under `models/cartoonizer/`.
  - Actual `.tflite` files are **not** committed; they are copied into `assets/models/` via scripts.
- **Cloud fallback**:
  - Uses the `http` package to call the FastAPI backend:
    - `POST /v1/cartoonize` with multipart upload.
    - Supports `mode=cloud` and `model_variant=fp16|int8`.
  - Handles timeouts and errors with user-friendly messages.
- **UI**:
  - Image selection from gallery (`image_picker`).
  - Mode selection: Offline (TFLite) vs Cloud (FastAPI).
  - Progress indicator and elapsed time display.
  - Output preview with share (`share_plus`) and “save to app storage” using `path_provider`.
  - Settings drawer for configuring API base URL and defaults.

## Bootstrapping and scripts

Existing helper resources remain under `mobile_app/scripts/`:

- `scripts/bootstrap_flutter_app.md` – original documentation and manual steps.
- `scripts/bootstrap_flutter_app.sh` – helper script (historical) for creating a skeleton Flutter project.

New scripts:

- `scripts/copy_model_to_assets.sh`
- `scripts/copy_model_to_assets.ps1`

These copy `.tflite` files from `models/artifacts/downloaded/` into:

```text
mobile_app/toonforge_app/assets/models/
```

and ensure the assets directory exists (with `.gitkeep` to keep it in git).

## Platform constraints

- Target platforms: **Android** and **iOS**.
- The project remains **free-first**:
  - Use free tooling and SDKs where possible.
  - Avoid paid services for push notifications, analytics, etc. unless they have generous free tiers.
- Store publishing (Google Play / Apple App Store) has external fees; see `docs/mobile_build.md` for details and free distribution alternatives.