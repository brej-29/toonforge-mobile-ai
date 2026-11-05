# 03 – Decisions log

This log captures important architectural and process decisions. Each entry should explain the context, the decision, and the rationale.

Format guideline:

- **ID**: Short stable identifier (DEC-000X).
- **Date**: When the decision was made.
- **Context**: Problem or question.
- **Decision**: What we chose.
- **Rationale**: Why we chose it.
- **Status**: Proposed, Accepted, Superseded, Rejected.

---

## DEC-0001 – Monorepo structure

- **Date**: 2026-01-24
- **Context**: We need to coordinate multiple components (Gradio, FastAPI, Streamlit, Flutter, model registry, docs).
- **Decision**: Use a single monorepo with well-defined subdirectories:
  - `cloud_infer_gradio/`
  - `api_web/backend/`
  - `api_web/web_streamlit/`
  - `mobile_app/`
  - `models/`
  - `docs/`
  - `context/`
- **Rationale**:
  - Easier cross-component refactoring and shared tooling.
  - Simplifies documentation and onboarding.
  - Keeps context and code changes synchronized.
- **Status**: Accepted

## DEC-0002 – Free-first, ZeroGPU-based cloud inference

- **Date**: 2026-01-24
- **Context**: Cloud GPU resources are expensive and often require paid accounts or credit cards.
- **Decision**: Use **Hugging Face Spaces with ZeroGPU** for cloud cartoonization models.
- **Rationale**:
  - Aligns with the free-first philosophy.
  - HF Spaces provide a simple deployment model for Gradio apps.
  - ZeroGPU offers GPU-backed compute without direct user billing.
- **Status**: Accepted

## DEC-0003 – FastAPI as stable API layer

- **Date**: 2026-01-24
- **Context**: Clients (web, mobile) need a stable, well-typed API surface, independent of how inference is implemented.
- **Decision**: Use **FastAPI** as the primary API layer, running on CPU-only infrastructure, and orchestrate calls to the Gradio Space from the backend.
- **Rationale**:
  - FastAPI provides strong typing, good performance, and great tooling.
  - Decouples client APIs from internal model deployment and evolution.
  - Simplifies future migration to other model backends (HF Hub, other services).
- **Status**: Accepted

## DEC-0004 – Streamlit as web UI

- **Date**: 2026-01-24
- **Context**: We want a simple, Python-first web UI for experimentation and demos.
- **Decision**: Use **Streamlit** for the browser-based web UI that talks to FastAPI.
- **Rationale**:
  - Minimal boilerplate for quickly building usable UIs.
  - Great for demos, hackathons, and interactive experimentation.
  - Fits well with Python-centric workflow and the existing dev stack.
- **Status**: Accepted

## DEC-0005 – Flutter + TFLite for mobile (offline-first)

- **Date**: 2026-01-24
- **Context**: The mobile experience should work offline and on low-cost devices.
- **Decision**: Use **Flutter** with **TFLite** for on-device cartoonization, with an optional cloud mode leveraging FastAPI.
- **Rationale**:
  - Flutter provides cross-platform (Android/iOS) support with a single codebase.
  - TFLite enables efficient on-device inference and offline usage.
  - Cloud mode via FastAPI gives users access to heavier models when online.
- **Status**: Accepted

## DEC-0006 – Structured logging and centralized error handling

- **Date**: 2026-01-24
- **Context**: Even early prototypes benefit from debuggability and observability.
- **Decision**: Use JSON-like structured logging and centralized error handling in the FastAPI backend.
- **Rationale**:
  - Simplifies log ingestion and filtering (even for simple setups).
  - Makes it easier to debug issues and correlate events in multi-service setups.
  - Establishes a production-aligned pattern from day one.
- **Status**: Accepted

## DEC-0007 – No models in repo, model registry only

- **Date**: 2026-01-24
- **Context**: Model weights are large, can be proprietary, and are not needed for the scaffold.
- **Decision**: Store no model weights in the repository. Instead, maintain a **model registry** in `models/MODEL_REGISTRY.md` with references and metadata.
- **Rationale**:
  - Keeps the repository light and easy to clone.
  - Avoids licensing and distribution issues for model weights.
  - Encourages a clean separation between code and model artifacts.
- **Status**: Accepted

## DEC-0008 – Free-first hosting and tooling

- **Date**: 2026-01-24
- **Context**: The project should be accessible without paid infrastructure or licenses.
- **Decision**: Prefer free-tier services (HF Spaces, open-source tooling) for hosting and CI.
- **Rationale**:
  - Lowers the barrier to entry for contributors and users.
  - Encourages sustainable, open development.
  - Aligns with the core philosophy of the project.
- **Status**: Accepted

## DEC-0014 – CPU-first Gradio Space with optional ZeroGPU

- **Date**: 2026-01-26
- **Context**: We want cloud inference via Gradio, but cannot assume GPU availability or paid plans.
- **Decision**: Implement the Gradio Space to run entirely on CPU by default, with an optional `@spaces.GPU` decorator that is only effective when ZeroGPU is explicitly enabled in the Space settings.
- **Rationale**:
  - Keeps the cloud path usable on free-tier CPU-only Spaces.
  - Allows seamless opt-in to ZeroGPU for users with PRO/org plans.
  - Avoids hard-coding any dependency on GPU availability or billing.
- **Status**: Accepted

## DEC-0015 – FastAPI wrapper calling Gradio via gradio_client

- **Date**: 2026-01-26
- **Context**: Web and mobile clients need a stable API that hides details of how cartoonization is implemented or hosted.
- **Decision**: Use FastAPI as the canonical API surface and have it call the Gradio Space via `gradio_client` for cloud mode (`mode=cloud`), while supporting local TFLite inference (`mode=local`) when available.
- **Rationale**:
  - Centralizes API contract and validation in a single service.
  - Allows changing or replacing the underlying Gradio/Space implementation without breaking clients.
  - Enables a clean separation between user-facing APIs and model deployment.
- **Status**: Accepted

## DEC-0016 – Mobile offline-first with TFLite and cloud fallback

- **Date**: 2026-01-26
- **Context**: The mobile experience should be reliable even with poor connectivity, but still be able to leverage cloud models when available.
- **Decision**: Design the Flutter app as offline-first using TFLite (via `tflite_flutter`) for on-device inference, with an optional cloud mode that calls the FastAPI backend.
- **Rationale**:
  - Ensures the app remains useful in low-connectivity or offline scenarios.
  - Reduces latency and dependency on remote infrastructure for common use.
  - Provides a path to heavier or experimental models via the cloud when desired.
- **Status**: Accepted

## DEC-0017 – No large binaries committed (model artifacts gitignored)

- **Date**: 2026-01-26
- **Context**: Model binaries are large and often subject to licensing constraints; they also slow down cloning and CI.
- **Decision**: Keep all model artifacts (downloaded TFLite, converted variants, benchmarks) under gitignored directories (`models/artifacts/`, Flutter `assets/models/`), with scripts and docs describing how to populate them locally.
- **Rationale**:
  - Keeps the repository lightweight and fast to clone.
  - Avoids accidental inclusion of large or licensed binary artifacts.
  - Encourages reproducible pipelines (models are derived from code + config, not from git history).
- **Status**: Accepted

## DEC-0018 – Strong separation of concerns: Gradio, FastAPI, Streamlit, Flutter

- **Date**: 2026-01-26
- **Context**: We want to avoid tight coupling between UI, API, and inference layers so that each can evolve independently.
- **Decision**: Maintain clear roles:
  - Gradio Space: inference-only service.
  - FastAPI: stable API contract and orchestration.
  - Streamlit: browser-based client that talks only to FastAPI.
  - Flutter: mobile client with offline TFLite and cloud mode via FastAPI.
- **Rationale**:
  - Simplifies reasoning about each component and its responsibilities.
  - Makes it easier to replace or scale individual components without rewriting others.
  - Keeps the architecture understandable and maintainable for new contributors.
- **Status**: Accepted

## DEC-0009 – TF Hub TFLite download convention

- **Date**: 2026-01-24
- **Context**: We need a reproducible way to obtain ready-to-use TFLite cartoonization models.
- **Decision**: Use TensorFlow Hub TFLite downloads by appending `?lite-format=tflite` to TF Hub model URLs, following the official convention.
- **Rationale**:
  - Aligns with TF Hub’s documented approach for TFLite artifacts.
  - Simplifies scripting and automation of model downloads.
  - Keeps the pipeline compatible with any future TF Hub cartoonization models.
- **Status**: Accepted

## DEC-0010 – Gitignored artifacts directory for models

- **Date**: 2026-01-24
- **Context**: Model binaries are large and should not be committed to git.
- **Decision**: Store all downloaded, converted, and benchmark-related artifacts under `models/artifacts/`, and gitignore that directory.
- **Rationale**:
  - Keeps the repository light and avoids accidentally committing large binaries.
  - Makes it clear where artifacts should be written and discovered.
  - Supports reproducibility: artifacts can be regenerated from code and configuration.
- **Status**: Accepted

## DEC-0011 – TFLite runtime with TensorFlow fallback

- **Date**: 2026-01-24
- **Context**: We need a CPU-only inference pipeline that works on a wide range of systems.
- **Decision**: Use `tflite-runtime` as the preferred interpreter for TFLite models, with a fallback to TensorFlow’s TFLite interpreter if `tflite-runtime` is unavailable.
- **Rationale**:
  - `tflite-runtime` is lightweight and well-suited for CPU inference.
  - TensorFlow provides a portable fallback for environments where `tflite-runtime` is not available.
  - The code detects missing interpreters and emits clear, user-friendly errors.
- **Status**: Accepted

## DEC-0012 – Quantization variants: fp32 baseline, fp16, int8

- **Date**: 2026-01-24
- **Context**: We want a conversion pipeline that explores standard post-training quantization trade-offs.
- **Decision**: Support three variants for SavedModel → TFLite conversion:
  - `fp32` baseline (no quantization),
  - `fp16` post-training quantization,
  - `int8` with dynamic range quantization by default and full integer quantization when a representative dataset is provided.
- **Rationale**:
  - Mirrors official TensorFlow Lite post-training quantization patterns.
  - Provides a clear comparison across quality, size, and latency.
  - Covers typical deployment targets from desktop to low-end mobile devices.
- **Status**: Accepted

## DEC-0013 – Avoid AnimeGANv2 for default / commercial use

- **Date**: 2026-01-24
- **Context**: Some popular cartoonization models (e.g. AnimeGANv2) have licenses that can be restrictive for commercial use.
- **Decision**: Avoid AnimeGANv2 and similarly restrictive models as default choices in this project. They may be considered as optional, explicitly documented cloud models later, but are not part of the core free-first pipeline.
- **Rationale**:
  - Reduces legal ambiguity for users who may want to use this project commercially.
  - Encourages the use of models with clearer, more permissive licensing.
  - Keeps the default pipelines aligned with the free-first and open ethos of the project.
- **Status**: Accepted