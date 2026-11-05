# FastAPI backend

This directory contains the **FastAPI backend** for the Mobile AI Cartoon Generation project. It is responsible for exposing a stable API surface for clients (Streamlit web UI, Flutter mobile app) and orchestrates calls to the Gradio Space or local TFLite models for cartoonization.

The backend is a **runnable service** with:

- `/health` endpoint for basic liveness checks.
- `/version` and `/v1/models` metadata endpoints.
- `/v1/cartoonize` for image cartoonization (local TFLite or cloud Gradio Space).
- Structured JSON-like logging.
- Centralized error handling utilities.
- Basic pytest-based tests.
- CI integration via GitHub Actions.

## Structure

```text
backend/
├─ app/
│  ├─ __init__.py
│  ├─ main.py                 # FastAPI app factory
│  ├─ config.py               # Lightweight settings via env vars
│  ├─ logging_config.py       # Structured logging configuration
│  ├─ routes/
│  │  ├─ __init__.py
│  │  ├─ health.py            # /health endpoint
│  │  ├─ meta.py              # /version and /v1/models
│  │  └─ cartoonize.py        # /v1/cartoonize endpoint
│  ├─ services/
│  │  ├─ __init__.py
│  │  ├─ cartoonize_local.py  # Local TFLite cartoonization helper
│  │  └─ cartoonize_cloud.py  # Gradio Space (cloud) cartoonization helper
│  └─ utils/
│     ├─ __init__.py
│     └─ errors.py            # Centralized error handling
├─ tests/
│  ├─ __init__.py
│  ├─ test_health.py          # Basic test for /health
│  └─ test_meta_and_cartoonize.py  # Tests for /version, /v1/models, and cartoonize validation
├─ requirements.txt
└─ README.md
```

## Running the API locally

Create and activate a virtual environment (optional):

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Install dependencies:

```bash
cd api_web/backend
pip install -r requirements.txt
```

Run the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or from the repo root:

```bash
make api
```

Check the health endpoint:

```bash
curl http://127.0.0.1:8000/health
```

You should see a JSON response similar to:

```json
{
  "status": "ok",
  "service": "Mobile AI Cartoon Generation API",
  "version": "0.0.0",
  "environment": "local"
}
```

## Configuration

Configuration is intentionally simple and uses environment variables (see `app/config.py`):

- `APP_NAME` – Application name (default: `Mobile AI Cartoon Generation API`).
- `LOG_LEVEL` – Logging level (default: `INFO`).
- `ENVIRONMENT` – Environment name (default: `local`).
- `APP_VERSION` – Application version (default: `0.0.0`).
- `API_VERSION` – Public API version string (default: `v1`).
- `GIT_SHA` – Optional git SHA for traceability (default: unset).
- `GRADIO_SPACE_ID` – Hugging Face Space ID for cloud mode (e.g. `username/toonforge-cartoonizer`).
- `GRADIO_API_NAME` – API name in the Gradio Space (default: `/predict`).
- `MODEL_CACHE_DIR` – Directory for cached TFLite models (default: `./models/artifacts/downloaded`).
- `MAX_UPLOAD_MB` – Maximum upload size for images in MB (default: `10`).

There is no `.env` file by default; hosting platforms should set environment variables directly.

## Logging

The backend uses the standard `logging` module with a JSON-like formatter configured in `logging_config.py`. Example log line:

```text
{"timestamp": "2026-01-24 12:00:00,000", "level": "INFO", "logger": "app.main", "message": "Application initialized"}
```

Use `logging.getLogger(__name__)` in new modules and let the central configuration handle formatting and handlers.

## Error handling

Central error handling lives in `app/utils/errors.py`:

- `APIError` – Custom application error with an HTTP status code.
- `register_exception_handlers` – Registers handlers for:
  - `APIError`
  - generic `Exception` (returns a 500 with a generic message).

When adding new routes, raise `APIError` (or FastAPI’s `HTTPException`) for expected error conditions. Unexpected exceptions are logged with stack traces and return a generic 500 response.

## Tests

Tests are implemented with `pytest` in `tests/`:

```bash
cd api_web/backend
pytest
```

Or from the repo root:

```bash
make test
```

The initial test suite includes:

- `test_health.py` – Verifies that `/health` returns HTTP 200 and the expected payload shape.

As you add new endpoints or behavior, include corresponding tests under `tests/`.