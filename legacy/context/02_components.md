# 02 – Components

This document lists the main components of the system, their responsibilities, and their current status. It is intended as a living inventory that evolves as the project grows.

## Component list

### 1. cloud_infer_gradio

- **Path**: `cloud_infer_gradio/`
- **Type**: Cloud inference service (Gradio on Hugging Face Spaces).
- **Runtime**: Python, Gradio, CPU-first with optional ZeroGPU.
- **Responsibilities**:
  - Provide a simple, HTTP-exposed API for cartoonization via Gradio.
  - Manage model download and caching from TF Hub.
  - Act as the single place where GPU-specific concerns live (when ZeroGPU is enabled).
- **Current status (v0.2.0)**:
  - Uses the shared `cartoonizer` Python package for TFLite inference.
  - Downloads and caches TFLite models into `cloud_infer_gradio/models_cache/`.
  - Ready to be deployed as a HF Space using CPU, with an optional `@spaces.GPU` decorator for ZeroGPU.

### 2. api_web/backend (FastAPI API)

- **Path**: `api_web/backend/`
- **Type**: Backend REST API.
- **Runtime**: Python, FastAPI, Uvicorn.
- **Responsibilities**:
  - Provide a stable, typed API for cartoonization and related features.
  - Orchestrate calls to the Gradio Space via `gradio_client` (cloud mode).
  - Run local TFLite inference using cached models (local mode) when dependencies are available.
  - Handle auth, validation, rate limiting, and observability (future).
  - Expose health and readiness endpoints for monitoring.
- **Current status (v0.2.0)**:
  - Application exposes:
    - `/health`, `/version`, `/v1/models`, `/v1/cartoonize`.
  - Centralized error handling utilities (`APIError`).
  - Structured JSON-like logging configuration.
  - Tests for health, metadata, and cartoonize validation behavior.
  - CI wiring for linting and backend tests.

### 3. api_web/web_streamlit (Streamlit UI)

- **Path**: `api_web/web_streamlit/`
- **Type**: Web front-end UI.
- **Runtime**: Python, Streamlit.
- **Responsibilities**:
  - Provide a user-friendly interface for uploading images and viewing results.
  - Communicate with the FastAPI API over HTTP.
  - Serve as an alternative to the mobile app for desktop users.
- **Current status (v0.2.0)**:
  - UI with image upload, mode selection (`local`/`cloud`), and model variant selection (`fp16`/`int8`).
  - Calls FastAPI `/v1/cartoonize` via multipart POST.
  - Displays latency headers and provides a PNG download button.

### 4. mobile_app (Flutter client)

- **Path**: `mobile_app/`
- **Type**: Native mobile client.
- **Runtime**: Flutter/Dart, TFLite.
- **Responsibilities**:
  - Provide an offline-first cartoonization experience via TFLite models.
  - Offer an optional cloud mode by calling the FastAPI backend.
  - Integrate with platform capabilities (camera, gallery, sharing).
- **Current status (v0.2.0)**:
  - Real Flutter project under `mobile_app/toonforge_app/`.
  - Uses `tflite_flutter` in an isolate to run on-device models.
  - Uses `http` to call the FastAPI backend for cloud mode.
  - Persists settings with `SharedPreferences`.
  - Requires manual copying of `.tflite` models into `assets/models/` (via scripts).

### 5. models

- **Path**: `models/`
- **Type**: Model registry, documentation, and Python tooling.
- **Runtime**: Python for the cartoonizer package.
- **Responsibilities**:
  - Define how models are named, versioned, and stored (e.g., HF Hub, external storage).
  - Provide metadata and references without storing raw weights.
  - Implement download, conversion, quantization, and benchmarking pipelines for TFLite models.
  - Document the mapping between models, their cartoon styles, and consumers (Gradio, TFLite).
- **Current status (v0.2.0)**:
  - Contains `README.md` and `MODEL_REGISTRY.md`.
  - `models/cartoonizer/` provides a production-style Python package:
    - CLI for download, inference, conversion, quantization, and benchmarking.
    - Tests and CI integration.
  - No model weights or large binaries are committed; all artifacts are gitignored.

### 6. docs

- **Path**: `docs/`
- **Type**: Human-facing documentation.
- **Responsibilities**:
  - Explain architecture, design decisions, and how to run/deploy the system.
  - Serve as an onboarding resource for new contributors.
- **Current status (v0.0.0)**:
  - Contains `README.md` and `architecture.md`.

### 7. context

- **Path**: `context/`
- **Type**: Project context and governance.
- **Responsibilities**:
  - Track goals, architecture, component inventory, decisions, changes, tests, and deployment plans.
  - Provide a timeline of how and why the system evolved.
- **Current status (v0.0.0)**:
  - Seed documents created with initial content and guidelines.

### 8. CI and tooling

- **Paths**:
  - `.github/workflows/python-ci.yml`
  - `.github/workflows/repo-lint.yml`
  - `.pre-commit-config.yaml`
  - `Makefile`
- **Responsibilities**:
  - Enforce basic quality standards across the repo.
  - Provide consistent local tooling and automation.
- **Current status (v0.0.0)**:
  - CI works for the backend (tests and lint).
  - Repository-level linting is configured for format and structure checks.

## Status summary

At v0.0.0, the monorepo is a **runnable scaffold**:

- Python services (FastAPI, Streamlit, Gradio) run locally with stub behavior.
- There is a clear path to:
  - Plug in real models on the Gradio side.
  - Extend FastAPI into a full API layer.
  - Wire Streamlit and Flutter to the backend.
- The context and docs are prepared to track all future changes and decisions.