# 00 – Project goal

## Vision

Build a **free-first Mobile AI Cartoon Generation** system that allows users to turn photos into high-quality cartoon images from:

- A **Flutter mobile app** (offline-first via TFLite, with optional cloud fallback).
- A **web UI** built with Streamlit.
- A **stable API layer** (FastAPI) that abstracts away model and infrastructure details.

The system should remain accessible to individual developers, educators, and hobbyists by prioritizing:

- Free-tier cloud resources (Hugging Face Spaces, ZeroGPU).
- Lightweight, offline-capable mobile experiences.
- Transparent architecture and documentation.

## Scope of this scaffold (v0.0.0)

This repository currently provides:

- A **monorepo structure** for:
  - `cloud_infer_gradio/` – Gradio-based cloud inference stub (ZeroGPU-ready).
  - `api_web/backend/` – FastAPI backend with health checks, logging, and tests.
  - `api_web/web_streamlit/` – Streamlit web UI skeleton.
  - `mobile_app/` – Flutter project bootstrap guidance (not a full app yet).
  - `models/` – Model registry and documentation (no weights or code yet).
  - `docs/` – High-level documentation and architecture.
  - `context/` – Living spec for goals, components, decisions, and change history.
- Tooling:
  - Basic CI (GitHub Actions) for linting and tests.
  - Pre-commit hooks (black, ruff, basic checks).
  - Makefile helpers for running services and tests.

**Out of scope** for this scaffold:

- Actual cartoonization models or TFLite pipelines.
- Integration between FastAPI and Gradio (to be added later).
- Integration between Streamlit/Flutter and FastAPI (to be added later).
- Production-grade deployment scripts (only high-level plans are documented).

## Success criteria

At the scaffold stage, success means:

1. A developer can clone the repo, set up a Python virtual environment, and:
   - Run the FastAPI `/health` endpoint.
   - Open the Streamlit UI and click a functional (but stubbed) "Cartoonize" button.
   - Run the Gradio app and see an image-in/image-out stub.
2. CI runs automatically on pushes/PRs and validates backend tests and basic repository linting.
3. The `context/` and `docs/` directories clearly explain:
   - The target architecture (cloud + mobile).
   - Major decisions (e.g., ZeroGPU, FastAPI wrapper, monorepo).
   - How the project will evolve to add real models later.