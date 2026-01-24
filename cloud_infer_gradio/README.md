# Cloud inference – Gradio (ZeroGPU-ready)

This directory contains the **cloud inference service** for the Mobile AI Cartoon Generation project, implemented as a **Gradio app** intended to run on **Hugging Face Spaces**.

> Models are **not** implemented yet. The current app is a stub that returns the input image unchanged.

## Goals

- Provide a simple, image-in/image-out interface for cartoonization.
- Run on Hugging Face Spaces with **ZeroGPU** for free GPU-powered inference.
- Serve as the single GPU-heavy component; all other services can stay CPU-only.

## Files

- `app.py` – Entry point for the Gradio app.
- `src/cartoonize_stub.py` – Stub cartoonization function (returns input image).
- `requirements.txt` – Python dependencies for the Space.

## Local development

Create and activate a virtual environment (optional):

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Install dependencies:

```bash
cd cloud_infer_gradio
pip install -r requirements.txt
```

Run the Gradio app:

```bash
python app.py
```

Then open the URL shown in the console (typically http://127.0.0.1:7860/).

## Hugging Face Spaces deployment (ZeroGPU)

1. Create a new Space on Hugging Face:
   - Type: **Gradio**
   - Hardware: CPU or **ZeroGPU**.
2. Copy or mirror the contents of `cloud_infer_gradio/` into the Space.
3. Ensure `requirements.txt` is used by the Space.
4. The `app.py` file exposes a Gradio `Blocks` app as `demo`.

### Adding a real model later

When adding an actual cartoonization model:

- Implement the real logic in `src/cartoonize_stub.py` (or a new module) and rename appropriately.
- Annotate GPU-heavy functions with `@spaces.GPU` (HF Spaces decorator) to leverage ZeroGPU.
- Keep the interface signature compatible so the FastAPI backend can call it via `gradio_client`.

For now, this app acts as a **stub contract**, not a model implementation.