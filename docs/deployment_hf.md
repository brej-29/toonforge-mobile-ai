# Deployment on Hugging Face Spaces (CPU-first)

This document describes how to deploy the main components of the Mobile AI Cartoon Generation project to **Hugging Face Spaces** using free CPU runtimes, with optional **ZeroGPU** support for the Gradio Space.

The components are:

- **Gradio Space** – cloud cartoonization service (`cloud_infer_gradio/`).
- **FastAPI backend** – stable API layer (`api_web/backend/`).
- **Streamlit web UI** – browser-based front-end (`api_web/web_streamlit/`).

> The Flutter mobile app is not deployed to HF Spaces; see `docs/mobile_build.md` for mobile build instructions.

---

## 1. Gradio Space (cloud_infer_gradio/)

### 1.1 Create the Space

1. On Hugging Face, create a new Space.
2. Choose:
   - **Type**: `Gradio`
   - **Hardware**: `CPU` (free tier) to start.
3. Give it a name such as `username/toonforge-cartoonizer`.

### 1.2 Populate the repository

Clone the Space and copy the Gradio app into it:

```bash
# Example: clone the Space repo
git clone https://huggingface.co/spaces/username/toonforge-cartoonizer
cd toonforge-cartoonizer

# Copy project files (from this repo)
cp -R path/to/monorepo/cloud_infer_gradio/* .
```

Ensure that:

- `app.py` exists at the root of the Space repo.
- `requirements.txt` is present.
- `src/` is copied as well.

If you want to reuse the shared Python cartoonizer package:

- Either:
  - Vendor the relevant `cartoonizer` code into the Space repo, or
  - Add it as a dependency in `requirements.txt` (for example, via a git URL pointing to a tagged release).

### 1.3 Install dependencies

HF Spaces automatically installs `requirements.txt`. It should include:

- `gradio`
- `Pillow`
- `numpy`
- `opencv-python-headless`
- `requests`
- Optional: TFLite runtime or TensorFlow (`tflite-runtime` or `tensorflow`).

The Gradio app:

- Downloads TFLite models from TF Hub into `./models_cache/` on first use.
- Runs cartoonization via `cartoonizer`’s TFLite pipeline.
- Exposes a Gradio `Blocks` app as `demo`.

### 1.4 Optional ZeroGPU

To use **ZeroGPU**:

1. Change the Space hardware from CPU to **ZeroGPU** in the Hugging Face UI (this may require a PRO/org plan).
2. The app’s main inference function is decorated with:

   ```python
   @spaces.GPU
   def cartoonize_endpoint(...):
       ...
   ```

3. On Spaces where `spaces` is not available, a small shim makes this decorator a no-op; on ZeroGPU-enabled Spaces, it routes work to a GPU-backed worker.

The project does **not** assume GPU availability; CPU is the default.

---

## 2. FastAPI backend Space (api_web/backend/)

You can deploy the backend as a **Docker Space** or a standard **Space**.

### 2.1 Docker Space approach (recommended)

1. Create a new Space:
   - **Type**: `Docker`.
   - **Hardware**: `CPU`.
2. Add a `Dockerfile` that:
   - Uses a Python base image.
   - Installs dependencies from `api_web/backend/requirements.txt`.
   - Optionally installs the `cartoonizer` package if you want local TFLite mode.
   - Runs `uvicorn app.main:app --host 0.0.0.0 --port 7860`.

3. Set `app_port` in `README.md` or the Space config to `7860`.

Environment variables (set in Space settings):

- `APP_NAME`
- `APP_VERSION`
- `ENVIRONMENT`
- `GRADIO_SPACE_ID` (e.g., `username/toonforge-cartoonizer`)
- `GRADIO_API_NAME` (default `/predict`)
- `MODEL_CACHE_DIR` (e.g., `./models_cache`)
- `MAX_UPLOAD_MB` (e.g., `10`)

The backend:

- Exposes `/health`, `/version`, `/v1/models`, and `/v1/cartoonize`.
- For `mode=cloud`, calls the Gradio Space via `gradio_client`.
- For `mode=local`, can run TFLite inference if the `cartoonizer` package and models are available.

### 2.2 Standard Space (non-Docker)

Alternatively, you can:

1. Create a standard Space (e.g., type `Gradio` or `Static`).
2. Use `uvicorn` in the `app.py` to start FastAPI.
3. Configure `requirements.txt` similarly.

The Docker approach is usually cleaner for FastAPI.

---

## 3. Streamlit Space (api_web/web_streamlit/)

1. Create a new Space:
   - **Type**: `Streamlit`.
   - **Hardware**: `CPU`.
2. Copy `api_web/web_streamlit/` contents into the Space repo.
3. Ensure `requirements.txt` is present (Streamlit + Pillow + requests).
4. The Space will run `streamlit run app.py`.

### 3.1 Backend configuration

Set the `API_BASE_URL` environment variable in the Space settings to point at your deployed FastAPI backend, e.g.:

- `https://username-fastapi-space-name.hf.space` (replace with real URL).

The Streamlit app:

- Calls `POST /v1/cartoonize` on the FastAPI backend.
- Displays the returned image and latency headers.
- Does not call the Gradio Space directly.

---

## 4. Environment variables and secrets

In all Spaces:

- Use the **Settings → Variables / Secrets** section to define environment variables.
- Do **not** commit secrets (tokens, API keys) to the repository.
- For ZeroGPU and HF-specific headers:
  - The backend can forward `x-ip-token` headers to the Gradio Space via `gradio_client`.
  - Any such tokens should be provided by the platform or environment, not stored in git.

---

## 5. Summary

- Gradio Space: deploy `cloud_infer_gradio/` (CPU-first, optional ZeroGPU).
- FastAPI backend: deploy `api_web/backend/` as a Docker Space or container, calling Gradio via `gradio_client`.
- Streamlit: deploy `api_web/web_streamlit/` as a Streamlit Space, configured with `API_BASE_URL`.
- Mobile app: connect to the same FastAPI backend for cloud mode; offline TFLite inference remains local on device.

This separation keeps each component simple and independently deployable while maintaining a clear, documented API contract between them.