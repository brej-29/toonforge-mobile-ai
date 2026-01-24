# 02 – Components

This document lists the main components of the system, their responsibilities, and their current status. It is intended as a living inventory that evolves as the project grows.

## Component list

### 1. cloud_infer_gradio

- **Path**: `cloud_infer_gradio/`
- **Type**: Cloud inference service (Gradio on Hugging Face Spaces).
- **Runtime**: Python, Gradio, ZeroGPU (GPU-enabled HF Space).
- **Responsibilities**:
  - Provide a simple, HTTP-exposed API for cartoonization via Gradio.
  - Manage heavy model loading and GPU-bound inference logic.
  - Act as the single place where GPU-specific concerns live.
- **Current status (v0.0.0)**:
  - Stub implementation: image-in/image-out with no transformation.
  - No external calls to this service yet.
  - Ready to be pushed as a HF Space using CPU or ZeroGPU (once models are added).

### 2. api_web/backend (FastAPI API)

- **Path**: `api_web/backend/`
- **Type**: Backend REST API.
- **Runtime**: Python, FastAPI, Uvicorn.
- **Responsibilities**:
  - Provide a stable, typed API for cartoonization and related features.
  - Orchestrate calls to the Gradio Space via `gradio_client` (future).
  - Handle auth, validation, rate limiting, and observability (future).
  - Expose health and readiness endpoints for monitoring.
- **Current status (v0.0.0)**:
  - Application scaffold with:
    - `main.py` creating the FastAPI app and including routers.
    - `/health` endpoint.
    - Centralized error handling utilities.
    - Structured logging configuration.
    - Basic tests and CI wiring.

### 3. api_web/web_streamlit (Streamlit UI)

- **Path**: `api_web/web_streamlit/`
- **Type**: Web front-end UI.
- **Runtime**: Python, Streamlit.
- **Responsibilities**:
  - Provide a user-friendly interface for uploading images and viewing results.
  - Communicate with the FastAPI API over HTTP.
  - Serve as an alternative to the mobile app for desktop users.
- **Current status (v0.0.0)**:
  - UI scaffold with image upload and a "Cartoonize" button.
  - Uses a local stub function, not connected to the backend yet.
  - Structured for easy future integration with FastAPI.

### 4. mobile_app (Flutter client)

- **Path**: `mobile_app/`
- **Type**: Native mobile client bootstrap.
- **Runtime**: Flutter/Dart, TFLite (future).
- **Responsibilities**:
  - Provide an offline-first cartoonization experience via TFLite models.
  - Offer an optional cloud mode by calling the FastAPI backend.
  - Integrate with platform capabilities (camera, gallery, sharing).
- **Current status (v0.0.0)**:
  - Not a full Flutter project yet.
  - Contains:
    - `pubspec.yaml` placeholder with guidance.
    - Scripts and docs to bootstrap a Flutter app aligned to this architecture.

### 5. models

- **Path**: `models/`
- **Type**: Model registry and documentation.
- **Runtime**: N/A (documentation only in v0.0.0).
- **Responsibilities**:
  - Define how models are named, versioned, and stored (e.g., HF Hub, external storage).
  - Provide metadata and references without storing raw weights.
  - Document the mapping between models, their cartoon styles, and consumers (Gradio, TFLite).
- **Current status (v0.0.0)**:
  - Contains `README.md` and `MODEL_REGISTRY.md` (definition only).
  - No concrete models or weights registered.

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