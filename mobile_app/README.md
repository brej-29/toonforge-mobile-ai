# Mobile app (Flutter)

This directory is reserved for the **Flutter mobile app** for the Mobile AI Cartoon Generation project.

The goal is to provide:

- An **offline-first** experience using on-device **TFLite** models.
- An optional **cloud mode** that calls the FastAPI backend for heavier models or styles.
- A shared user experience with the Streamlit web UI where appropriate.

## Current status (v0.0.0)

- This is **not** a full Flutter project yet.
- Instead, it provides:
  - A placeholder `pubspec.yaml` with guidance.
  - Scripts in `scripts/` to bootstrap a new Flutter project consistent with this architecture.

## Planned architecture

- **On-device inference**:
  - Use `tflite_flutter` to run cartoonization models on-device.
  - Models will be documented in `models/MODEL_REGISTRY.md` and stored externally (e.g., HF Hub, storage buckets).
- **Cloud fallback**:
  - Use a small HTTP client to call the FastAPI backend when:
    - The user explicitly selects cloud mode, or
    - The device cannot run a given model locally.
- **UI**:
  - Image capture (camera) and selection (gallery).
  - Display of cartoonized results.
  - Simple toggles between offline and cloud modes.

## Bootstrapping a Flutter app

See:

- `scripts/bootstrap_flutter_app.md` – documentation and manual steps.
- `scripts/bootstrap_flutter_app.sh` – helper script (optional) for creating a skeleton Flutter project.

These resources are designed to:

- Create a new Flutter project under this directory.
- Set up a basic folder structure for:
  - TFLite integration.
  - API clients.
  - UI pages for image upload and result viewing.

## Platform constraints

- Target platforms: **Android** and **iOS**.
- The project should remain **free-first**:
  - Use free tooling and SDKs.
  - Avoid paid services for push notifications, analytics, etc. unless they have generous free tiers.