# Streamlit web UI

This directory contains the **Streamlit web UI** for the Mobile AI Cartoon Generation project.

As of `v0.2.0`, the app is a **real frontend** for the FastAPI backend:

- Lets the user upload an image.
- Allows selecting:
  - Mode: `local` (CPU TFLite on backend) or `cloud` (Gradio Space via `gradio_client`).
  - Model variant: `fp16` or `int8`.
- Calls the FastAPI `/v1/cartoonize` endpoint via HTTP.
- Displays the cartoonized result and latency metadata from response headers.
- Provides a download button for the resulting PNG.

## Files

- `app.py` – Main Streamlit application.
- `requirements.txt` – Python dependencies for this app.

## Local development

Create and activate a virtual environment (optional):

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
```

Install dependencies:

```bash
cd api_web/web_streamlit
pip install -r requirements.txt
```

Make sure the FastAPI backend is running (from the repository root):

```bash
make api
# or:
# cd api_web/backend
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run the Streamlit app:

```bash
cd api_web/web_streamlit
streamlit run app.py
```

The browser should open automatically; if not, visit the URL shown in the terminal (typically http://localhost:8501/).

By default, the app calls the backend at `http://127.0.0.1:8000`. You can override this by setting:

```bash
export API_BASE_URL="http://your-backend-host:8000"
```

before running `streamlit run`.

## Backend interaction

The app sends a multipart POST request to:

- `POST /v1/cartoonize`

with form fields:

- `mode`: `local` or `cloud`
- `model_variant`: `fp16` or `int8`
- `output`: `png` (currently fixed)

and file field:

- `image`: uploaded image (PNG/JPEG).

The backend returns PNG bytes and includes headers such as:

- `x-latency-total-ms`
- `x-latency-infer-ms` (for local mode)
- `x-mode`
- `x-variant`

These are displayed in the UI for quick inspection.

## Deployment

This Streamlit app is intended to be deployable on free-tier services, such as:

- **Hugging Face Spaces** (type: Streamlit).
- Other free Python hosting providers.

In all cases, the app should remain stateless and rely on the FastAPI backend for heavy lifting. See `docs/deployment_hf.md` for guidance on deploying Streamlit and the backend to Hugging Face Spaces.