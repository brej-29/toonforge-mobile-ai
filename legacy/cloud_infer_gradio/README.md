---
title: ToonForge Cartoonizer (Gradio)
sdk: gradio
app_file: app.py
pinned: false
---

# Cloud inference – Gradio (ZeroGPU-ready)

This directory contains the **cloud inference service** for the Mobile AI Cartoon Generation project, implemented as a **Gradio app** intended to run on **Hugging Face Spaces**.

The app now runs a **real TFLite cartoonization pipeline** via the shared `cartoonizer` package:

- Accepts an input image.
- Lets the user choose a model variant (`fp16` / `int8`).
- Runs inference on **CPU by default** using TFLite.
- Displays the cartoonized output and latency metrics.

An optional `@spaces.GPU` decorator is present to enable **ZeroGPU** later, but this is **disabled by default** unless configured in the Space settings.

## Goals

- Provide a simple, image-in/image-out interface for cartoonization.
- Run on Hugging Face Spaces with **free CPU** by default.
- Be ready for optional **ZeroGPU** acceleration when a PRO/org plan is available.
- Serve as the single potentially GPU-heavy component; all other services can stay CPU-only.

## Files

- `app.py` – Entry point for the Gradio app; exposes `demo` for HF Spaces.
- `src/cartoonize_stub.py` – Contains `cartoonize_with_tflite` and cache logic using the shared cartoonizer pipeline.
- `requirements.txt` – Python dependencies for the Space.

## Local development

Create and activate a virtual environment (optional):

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
```

Install dependencies (plus the local cartoonizer package):

```bash
cd cloud_infer_gradio
pip install -r requirements.txt
# Install the shared cartoonizer package (from repo root):
# pip install -e models/cartoonizer
```

Run the Gradio app:

```bash
python app.py
```

Then open the URL shown in the console (typically http://127.0.0.1:7860/).

On first use, the app will:

- Download the TFLite model(s) from TF Hub using the `?lite-format=tflite` convention.
- Cache them under `cloud_infer_gradio/models_cache/`.

## Hugging Face Spaces deployment (CPU-first, optional ZeroGPU)

1. Create a new Space on Hugging Face:
   - Type: **Gradio**
   - Hardware: **CPU** (default). You can later switch to **ZeroGPU** if you have access.
2. Copy or mirror the contents of `cloud_infer_gradio/` into the Space repository.
3. Ensure `requirements.txt` is used by the Space, and that the `cartoonizer` package is installed (for example, by including it as a dependency or vendoring it).
4. The `app.py` file exposes a Gradio `Blocks` app as `demo`.

### ZeroGPU decorator

The main inference function is decorated with:

```python
@spaces.GPU
def cartoonize_endpoint(...):
    ...
```

- On **CPU-only** Spaces, this decorator has no effect (a small no-op shim is used when `spaces` is not importable).
- On **ZeroGPU-enabled** Spaces, enabling GPU in the Space settings will route the decorated function to a GPU-backed worker.

> Enabling ZeroGPU may require a PRO or org plan on Hugging Face. The project does **not** assume GPU availability by default.

## Interface contract

The Gradio interface is designed so that the FastAPI backend can call it via `gradio_client` later:

- Input: `image` (image) and `model_variant` (`fp16` / `int8`).
- Output: `(cartoonized_image, metrics)` where:
  - `cartoonized_image` is a standard image object.
  - `metrics` is a JSON-serializable dict with timing information (ms).

This keeps the Space self-contained while aligning with the backend’s `cloud` mode expectations.