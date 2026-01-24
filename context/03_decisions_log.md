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