# Mobile AI Cartoon Generation Monorepo

This repository is a free-first, production-style monorepo for a **Mobile AI Cartoon Generation** stack. It combines a cloud inference service (Gradio on Hugging Face Spaces with ZeroGPU), a FastAPI backend as a stable API layer, a Streamlit web UI, and a Flutter mobile client that will support offline TFLite inference with a cloud fallback. Models are not implemented yet; this scaffold provides runnable skeleton apps, shared tooling, and clear documentation so the project can evolve incrementally.

## Architecture overview

High-level data flow and components:

```text
+-----------------------------+
|       Mobile App (Flutter)  |
|  - Offline TFLite (future)  |
|  - Cloud mode via FastAPI   |
+--------------+--------------+
               |
               | HTTP (future)
               v
+--------------+--------------+
|      Streamlit Web UI       |
|  - Browser-based front-end  |
|  - Talks to FastAPI later   |
+--------------+--------------+
               |
               | HTTP (REST)
               v
+--------------+--------------+
|   FastAPI Backend (CPU)     |
|  - Stable API surface       |
|  - Orchestrates requests    |
|  - Will call Gradio Space   |
+--------------+--------------+
               |
               | gradio_client (future)
               v
+-----------------------------+
|  Gradio Space (ZeroGPU)     |
|  - Heavy cartoon model      |
|  - GPU via HF ZeroGPU       |
+-----------------------------+

+-----------------------------+
|       Models/ Registry      |
|  - Describes model assets   |
|  - No weights committed     |
+-----------------------------+
```

Key principles:

- **Free-first**: Use Hugging Face Spaces (ZeroGPU and CPU), local dev environments, and other free-tier services.
- **Monorepo**: All core components (cloud, API, web, mobile, models, docs, context) live in one repo.
- **Production-style**: Structured logging, typed Python, tests, CI, and clear documentation from day one.
- **Context-aware**: The `context/` folder tracks goals, architecture, decisions, and change history.

## Repository layout

See the project tree for the required structure (summarized):

- `cloud_infer_gradio/` – Gradio app for cloud cartoonization (ZeroGPU-ready stub).
- `api_web/backend/` – FastAPI backend with tests and logging.
- `api_web/web_streamlit/` – Streamlit web front-end.
- `mobile_app/` – Flutter mobile app bootstrap guidance (TFLite + cloud fallback later).
- `models/` – Model registry and documentation (no weights).
- `docs/` – High-level docs and architecture.
- `context/` – Living project spec: goals, architecture, decisions, change log, deploy/test plans.

## Local development

### Prerequisites

- Python 3.10+ (recommended)
- `pip` and virtualenv support
- Node/Flutter are **not required** to run the Python services, but Flutter is needed for the mobile app later.
- Recommended: `make`, `pre-commit`, and `git`.

Create a virtual environment at the repo root if desired:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
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

Then open: http://127.0.0.1:8000/health

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

The Streamlit app will show an image upload widget and a "Cartoonize" button. At this stage it uses a local stub and **does not** call the FastAPI backend yet, but the structure is ready for integration.

### Gradio cloud stub (cloud_infer_gradio)

Install dependencies and run the Gradio interface locally:

```bash
cd cloud_infer_gradio
pip install -r requirements.txt
python app.py
```

Or from the repo root:

```bash
make gradio
```

The Gradio app currently returns the input image unchanged via the `cartoonize_stub` function. In the cloud deployment, this will wrap the heavy GPU cartoonization model using Hugging Face Spaces with ZeroGPU.

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

## Deployment plan (free-first)

The initial deployment strategy uses only free-tier services:

- **Gradio Space (ZeroGPU)**  
  - `cloud_infer_gradio/` will be deployed as a Hugging Face Space using the ZeroGPU runtime.
  - Heavy cartoonization models will run here, annotated with `@spaces.GPU` when implemented.
- **FastAPI backend (CPU)**  
  - `api_web/backend/` will be deployed as a CPU-only Hugging Face Space or another free-tier container service.
  - This service will call the Gradio Space via `gradio_client` to perform cartoonization.
- **Streamlit web UI**  
  - `api_web/web_streamlit/` can be deployed as a separate Hugging Face Space or similar free hosting provider.
  - It will communicate with the FastAPI backend instead of calling the Gradio Space directly.
- **Flutter mobile app**  
  - Distributed via mobile app stores.
  - Will run TFLite models offline and use the FastAPI backend as a cloud mode (when network is available).

Detailed deployment and evolution steps are described in `context/06_deploy_plan.md` and `docs/architecture.md`.