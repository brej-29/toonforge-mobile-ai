# 01 – Architecture

This document describes the **high-level architecture** for the Mobile AI Cartoon Generation project and how the monorepo is organized.

## Core architecture

The system comprises four main runtime components plus supporting assets:

1. **Cloud inference (Gradio + ZeroGPU)**
2. **API backend (FastAPI)**
3. **Web UI (Streamlit)**
4. **Mobile client (Flutter + TFLite)**

### Runtime components and data flow

```text
[Flutter Mobile App]  -- HTTP (future) -->  [FastAPI Backend]  -- gradio_client (future) -->  [Gradio Space]

[Streamlit Web UI]    -- HTTP (future) -->  [FastAPI Backend]
```

#### 1. Gradio Space (cloud_infer_gradio)

- Implemented as a **Gradio app** deployed to **Hugging Face Spaces**.
- Will use **ZeroGPU** for free GPU access.
- Responsibilities:
  - Load and manage cartoonization models (future).
  - Provide a simple HTTP-compatible interface via Gradio for inference.
  - Scale horizontally by HF infrastructure (within free-tier constraints).
- In the scaffold:
  - `cartoonize_stub` returns the input image unchanged.
  - Serves as a contract for how image data flows in and out.

#### 2. FastAPI backend (api_web/backend)

- Runs on **CPU-only infrastructure** (HF Space or similar).
- Responsibilities:
  - Provide a stable, versioned REST API for clients (web, mobile).
  - Perform input validation, authentication/authorization (future), and orchestration.
  - Call the Gradio Space via `gradio_client` (future) for heavy cartoonization.
  - Implement structured logging and centralized error handling.
- In the scaffold:
  - Exposes a `/health` endpoint with a typed response model.
  - Configures JSON-like structured logging.
  - Includes basic tests and CI integration.

#### 3. Streamlit web UI (api_web/web_streamlit)

- Browser-based front-end for desktop/laptop users.
- Responsibilities:
  - Provide a simple UI to upload images and trigger cartoonization.
  - Display results and error messages in a user-friendly way.
  - Communicate with the FastAPI backend (not directly with Gradio).
- In the scaffold:
  - Displays an image upload widget and a "Cartoonize" button.
  - Uses a local stub function; the wiring to FastAPI is not implemented yet.
  - Code is structured so that replacing the stub with an API client is straightforward.

#### 4. Flutter mobile app (mobile_app)

- Native mobile client (Android/iOS) built with Flutter.
- Responsibilities:
  - Offer an offline-first experience using **TFLite** models on-device.
  - Provide optional cloud mode by calling the FastAPI backend.
  - Handle image capture, gallery selection, and result sharing.
- In the scaffold:
  - No Flutter project is committed.
  - Instead, documentation and scripts explain how to bootstrap a Flutter app that fits this architecture.
  - Future work will add:
    - A TFLite inference layer using `tflite_flutter`.
    - A simple HTTP client to talk to the FastAPI backend.

## Repository layout and responsibilities

- `cloud_infer_gradio/`
  - Gradio application exposing a cartoonization interface.
  - Will host ZeroGPU GPU-bound model inference.
- `api_web/backend/`
  - FastAPI project with:
    - `app/` – main application package.
    - `tests/` – pytest tests.
    - `requirements.txt` – API dependencies.
- `api_web/web_streamlit/`
  - Streamlit application.
  - Future HTTP client to the FastAPI backend.
- `mobile_app/`
  - Documentation and bootstrap scripts for the Flutter app.
- `models/`
  - Logical registry of models, configurations, and expected artifacts.
  - No model weights or proprietary data stored directly.
- `docs/`
  - Project documentation, including architecture explanations and diagrams.
- `context/`
  - Living specification:
    - Goals, architecture notes, components, decisions, changes, test and deploy plans, and a Cosine task log.

## Cross-cutting concerns

### Logging

- **FastAPI backend**:
  - Uses the standard `logging` module with a JSON-like formatter.
  - Central configuration in `logging_config.py`.
  - Errors are handled centrally via `utils/errors.py`, which integrates with logging.
- **Streamlit and Gradio**:
  - Use simple logging (standard library) if needed, avoiding heavy dependencies.
  - Console logs should be short and descriptive.

### Error handling

- Centralized error utilities in `api_web/backend/app/utils/errors.py`:
  - Custom application error type for consistent error responses.
  - Handlers for unexpected exceptions to avoid leaking stack traces.
- The goal is to provide **meaningful error responses** to clients while keeping internals hidden.

### Testing and CI

- **Backend tests**:
  - Pytest-based tests live in `api_web/backend/tests/`.
  - Initial focus is on health checks and basic behavior.
- **CI (GitHub Actions)**:
  - `python-ci.yml` runs:
    - Linting (ruff, black) for the backend.
    - Unit tests for the backend.
  - `repo-lint.yml` runs repository-wide checks (formatting / basic structure).

### Configuration and secrets

- Configuration is intentionally minimal:
  - The scaffold uses environment variables only for simple settings (like log level) via a lightweight config module.
- No secrets are committed to the repo.
- `.env` files are ignored via `.gitignore`.
- If necessary, `.env.example` will be added later to document expected variables.

## Evolution path

### Short-term

- Implement real endpoints behind FastAPI that:
  - Accept images.
  - Call a stubbed "cartoonize" service layer.
- Replace Streamlit stub logic with calls to the FastAPI backend.
- Define the Gradio–FastAPI protocol and implement a first `gradio_client` integration using a lightweight toy model.

### Medium-term

- Add the Flutter project and integrate:
  - Offline TFLite pipelines.
  - Cloud fallback via FastAPI.
- Harden API (rate limiting, authentication/authorization where needed).
- Introduce observability (request IDs, correlation IDs, metrics).

### Long-term

- Support multiple cartoonization styles/models via the `models/` registry.
- Add multi-tenant or multi-user features (profiles, persisted history) if desired.
- Explore additional deployment options while remaining free-first wherever possible.