# 05 – Test plan

This document outlines the initial testing strategy for the Mobile AI Cartoon Generation project. It will evolve as we add real models, external integrations, and new features.

## Goals

- Provide **fast feedback** for changes (unit tests and lint).
- Ensure **basic reliability** of API endpoints and UIs.
- Maintain **compatibility** with free-tier infrastructure and local dev environments.
- Keep the test tooling **simple and standard** (pytest, Streamlit/Gradio smoke tests).

## Scope (v0.0.0–v0.1.0)

At the scaffold stage and the initial model POC, tests focus on:

- The **FastAPI backend**:
  - Health endpoint correctness.
  - Application creation and logging configuration.
- The **cartoonizer model package**:
  - CLI parsing and basic behavior.
  - Preprocessing and postprocessing correctness on synthetic data.
  - Registry structure and invariants.
- **Repository structure and formatting**:
  - CI workflows run linters and basic checks.

No automated tests are required yet for:

- Gradio stub behavior.
- Streamlit UI interactions.
- Flutter mobile bootstrapping.

Smoke tests for these components are manual for now.

## Test types

### 1. Unit tests (Python)

- **Framework**: `pytest`
- **Locations**:
  - `api_web/backend/tests/`
  - `models/cartoonizer/tests/`
- **Initial coverage**:
  - `/health` endpoint returns HTTP 200.
  - Response schema contains expected fields.
  - Cartoonizer preprocessing/postprocessing round-trip behavior on synthetic images.
  - Cartoonizer CLI smoke tests (e.g. `python -m cartoonizer --help`).
  - Registry format and required fields for registered models.
- **Future coverage** (planned):
  - Cartoonization request handlers (once implemented).
  - Error handling utilities and edge cases.
  - Configuration handling and environment-based behavior.
  - End-to-end tests for the cartoonizer inference and conversion pipelines.

### 2. Integration tests (future)

Once the Gradio Space and FastAPI integration exist:

- Write integration tests that:
  - Spin up the FastAPI app.
  - Mock or call a test Gradio endpoint.
  - Validate error handling when Gradio is unavailable or slow.
- Consider adding **contract tests** between FastAPI and Gradio (stubbing `gradio_client`).

### 3. UI tests (manual, early stage)

For v0.0.0 and early iterations:

- **Gradio**:
  - Manual check: run `python app.py` in `cloud_infer_gradio/`.
  - Upload an image and confirm that the stub returns the same image.
- **Streamlit**:
  - Manual check: run `streamlit run app.py` in `api_web/web_streamlit/`.
  - Upload an image and click "Cartoonize"; confirm no errors and stub behavior.
- **Flutter**:
  - Once the app exists, use Flutter’s dev tools and basic widget tests.

Automated UI testing may be considered later but is not required initially.

## CI integration

### python-ci workflow

- Runs on pushes and pull requests.
- Steps:
  - Install Python and dependencies for:
    - `api_web/backend`
    - `models/cartoonizer`
  - Run:
    - `ruff` + `black --check` on backend and cartoonizer code.
    - `pytest` on backend tests.
    - `pytest` on cartoonizer tests (which are designed to avoid model downloads and heavy optional deps).

### repo-lint workflow

- Runs repository-wide checks:
  - Format validation (ruff/black or pre-commit).
  - Basic structure checks (presence of key files/directories).

### CI and models

- CI **does not** download real models or run conversion/benchmark commands by default.
- Cartoonizer tests and linters only rely on lightweight dependencies and synthetic data.
- Developers can run full pipelines (download, infer, benchmark, convert) locally as needed.

## Test data

- Prefer **synthetic** and **small** test data:
  - Small example images stored outside the repo if possible (or generated on the fly).
  - No personal or sensitive user data.
- Backend tests use basic JSON payloads and require no image files.
- Cartoonizer tests use small synthetic arrays and do not download real models.

## Quality thresholds

Initial expectations:

- All backend tests and lint checks must pass before merging.
- New APIs should include at least:
  - Happy-path unit tests.
  - Tests for obvious failure cases (bad input, missing parameters).

As the project matures, we can introduce:

- Coverage tracking (for example, via `coverage.py`).
- Minimal coverage thresholds for critical modules (API handlers, service layer).