# Mobile AI Cartoon Generation Monorepo

This repository is a free-first, production-style monorepo for a **Mobile AI Cartoon Generation** stack. It combines:

- A cloud inference service (Gradio on Hugging Face Spaces, CPU-first with optional ZeroGPU).
- A FastAPI backend as a stable API layer for web and mobile.
- A Streamlit web UI that talks to the backend.
- A Flutter mobile app with offline TFLite inference and cloud fallback (code included; models copied locally by script).
- A shared cartoonizer model package for TFLite download, conversion, and benchmarking.

No large model binaries are committed; all artifacts live under gitignored folders and can be regenerated.

## Architecture overview

High-level data flow and components:

```text
+-----------------------------+
|       Mobile App (Flutter)  |
|  - Offline TFLite           |
|  - Cloud mode via FastAPI   |
+--------------+--------------+
               |
               | HTTP (REST)
               v
+--------------+--------------+
|      Streamlit Web UI       |
|  - Browser-based front-end  |
|  - Calls FastAPI /v1 APIs   |
+--------------+--------------+
               |
               | HTTP (REST)
               v
+--------------+--------------+
|   FastAPI Backend (CPU)     |
|  - Stable API surface       |
|  - /health, /version        |
|  - /v1/models, /v1/cartoonize|
|  - Local TFLite or Gradio   |
+--------------+--------------+
               |
               | gradio_client (cloud mode)
               v
+-----------------------------+
|  Gradio Space (CPU-first)   |
|  - TFLite cartoonizer       |
|  - Optional @spaces.GPU     |
+-----------------------------+

+-----------------------------+
|   models/cartoonizer        |
|  - TFLite download / infer  |
|  - SavedModel->TFLite conv  |
|  - Benchmarking + registry  |
+-----------------------------+
```

Key principles:

- **Free-first**: Use Hugging Face Spaces (CPU + optional ZeroGPU), local dev environments, and other free-tier services.
- **Monorepo**: All core components (cloud, API, web, mobile, models, docs, context) live in one repo.
- **Production-style**: Structured logging, typed Python, tests, CI, and clear documentation from day one.
- **Context-aware**: The `context/` folder tracks goals, architecture, decisions, and change history.
- **Artifact-safe**: No large binaries in git; everything under `models/artifacts/` or app assets is regenerated or copied by scripts.

## Repository layout

Summarized:

- `cloud_infer_gradio/` – Gradio app for cloud cartoonization (CPU-first, ZeroGPU-ready).
- `api_web/backend/` – FastAPI backend with `/health`, `/version`, `/v1/models`, and `/v1/cartoonize`.
- `api_web/web_streamlit/` – Streamlit web front-end that calls FastAPI.
- `mobile_app/` – Flutter app (`toonforge_app/`) for offline TFLite + cloud fallback, plus scripts/docs.
- `models/cartoonizer/` – Model pipeline: TF Hub download, TFLite inference, conversion/quantization, benchmarking.
- `models/MODEL_REGISTRY.md` – Logical registry of models (no weights).
- `docs/` – High-level docs (architecture, API contract, deployment, mobile build).
- `context/` – Living project spec: goals, architecture, decisions, change log, deploy/test plans.

## Local development

### Prerequisites

- Python 3.10+ (recommended).
- `pip` and virtualenv support.
- `make`, `pre-commit`, and `git` (recommended).
- Flutter SDK for running the mobile app (not required for CI or Python services).

Create a virtual environment at the repo root if desired:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
```

### FastAPI backend (api_web/backend)

Install dependencies and run the API:

```bash
cd api_web/backend
pip install -r requirements.txt

# Run with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or from the repo root using the Makefile:

```bash
make api
```

Then open: http://127.0.0.1:8000/health and http://127.0.0.1:8000/version.

Key endpoints:

- `GET /health`
- `GET /version`
- `GET /v1/models`
- `POST /v1/cartoonize` (multipart: `image`, `mode=local|cloud`, `model_variant=fp16|int8`, `output=png`)

### Streamlit web UI (api_web/web_streamlit)

Install dependencies and run the app:

```bash
cd api_web/web_streamlit
pip install -r requirements.txt
streamlit run app.py
```

Or from the repo root:

```bash
make web
```

The Streamlit app:

- Accepts image uploads.
- Lets you choose `local` or `cloud` mode and `fp16`/`int8` variant.
- Calls the FastAPI `/v1/cartoonize` endpoint.
- Displays the cartoonized result, latency headers, and a PNG download button.

Set `API_BASE_URL` to point to your backend if not using the default `http://127.0.0.1:8000`.

### Gradio cloud app (cloud_infer_gradio)

Install dependencies and run the Gradio interface locally:

```bash
cd cloud_infer_gradio
pip install -r requirements.txt
# Install the shared cartoonizer package if you want real inference:
# pip install -e ../models/cartoonizer
python app.py
```

Or from the repo root:

```bash
make gradio
```

The Gradio app:

- Downloads TFLite models from TF Hub on first use (into `cloud_infer_gradio/models_cache/`).
- Runs cartoonization via the shared `cartoonizer` pipeline on CPU.
- Shows latency metrics in the UI.
- Uses an optional `@spaces.GPU` decorator that becomes active only when ZeroGPU is enabled in HF Spaces settings.

### Cartoonizer model pipeline (models/cartoonizer)

The `cartoonizer` package provides:

- TF Hub TFLite downloads (using `?lite-format=tflite`).
- Local inference on images.
- SavedModel → TFLite conversion (fp32, fp16, int8).
- Benchmarking of latency and size.

From `models/cartoonizer`:

```bash
pip install -r requirements.txt
pip install -e .

# CLI help
python -m cartoonizer --help

# Download models (if TF Hub IDs are valid)
python -m cartoonizer download --model-id cartoongan-fp16

# Inference
python -m cartoonizer infer --model ../artifacts/downloaded/cartoongan-fp16.tflite \
  --input /path/to/input.jpg \
  --output /path/to/output_cartoon.jpg

# Benchmark
python -m cartoonizer benchmark --model ../artifacts/downloaded/cartoongan-fp16.tflite \
  --input /path/to/input.jpg
```

All artifacts are stored under `models/artifacts/` (gitignored).

### Flutter mobile app (mobile_app/toonforge_app)

A real Flutter app is included under `mobile_app/toonforge_app/`:

- Offline TFLite inference via `tflite_flutter` (model not committed).
- Cloud fallback via FastAPI `/v1/cartoonize`.
- Image picking (gallery), progress indicators, latency display.
- Settings screen for API base URL, default mode, and model variant.
- Scripts under `mobile_app/scripts/` to copy a TFLite model from `models/artifacts/downloaded/` into Flutter assets.

See:

- `mobile_app/README.md`
- `mobile_app/toonforge_app/README.md`
- `docs/mobile_build.md`

for detailed setup and build instructions.

> CI does **not** build or test Flutter code; mobile is a local-only build target.

### Tooling

From the repo root, after installing dev tools (`pip install black ruff pre-commit`), you can run:

```bash
# Run tests for the FastAPI backend
make test

# Run linters (ruff + black --check) across the Python code
make lint

# Helpful setup instructions
make setup
```

To enable `pre-commit`:

```bash
pre-commit install
pre-commit run --all-files
```

CI (GitHub Actions) runs:

- Backend tests and linting.
- Cartoonizer package tests and linting.
- No Flutter builds and no model downloads.

## Deployment plan (free-first)

The initial deployment strategy uses only free-tier services:

- **Gradio Space (CPU-first, optional ZeroGPU)**  
  - `cloud_infer_gradio/` can be deployed as a Hugging Face Space (type: Gradio).
  - Runs TFLite cartoonization on CPU; optional `@spaces.GPU` decorator can leverage ZeroGPU if enabled.
- **FastAPI backend (CPU)**  
  - `api_web/backend/` can be deployed as a CPU-only Hugging Face Docker Space or another free-tier container service.
  - Calls the Gradio Space via `gradio_client` when `mode=cloud`.
  - Can also perform local TFLite inference when `mode=local` and models/deps are available.
- **Streamlit web UI**  
  - `api_web/web_streamlit/` can be deployed as a Hugging Face Streamlit Space or similar free host.
  - Communicates with the FastAPI backend (not directly with Gradio).
- **Flutter mobile app**  
  - Built and distributed outside CI.
  - Runs TFLite models offline and uses the FastAPI backend as a cloud mode (when network is available).

Detailed deployment and evolution steps are described in:

- `context/06_deploy_plan.md`
- `docs/architecture.md`
- `docs/deployment_hf.md`
- `docs/api_contract.md`.