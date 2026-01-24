# Streamlit web UI

This directory contains the **Streamlit web UI** for the Mobile AI Cartoon Generation project.

At this stage, the app is a **UI scaffold**:

- Lets the user upload an image.
- Displays a "Cartoonize" button.
- Uses a local stub function that returns the original image unchanged.
- Does **not** call the FastAPI backend yet, but is structured so that integration is easy.

## Files

- `app.py` – Main Streamlit application.
- `requirements.txt` – Python dependencies for this app.

## Local development

Create and activate a virtual environment (optional):

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Install dependencies:

```bash
cd api_web/web_streamlit
pip install -r requirements.txt
```

Run the app:

```bash
streamlit run app.py
```

The browser should open automatically; if not, visit the URL shown in the terminal (typically http://localhost:8501/).

## Future backend integration

Later, the `cartoonize_local_stub` function in `app.py` will be replaced or extended to:

- Call the FastAPI backend over HTTP, sending the uploaded image.
- Display the cartoonized result returned by the backend.
- Show meaningful error messages when the backend is unreachable.

When that happens, we may need to add a lightweight HTTP client dependency (for example, `requests` or `httpx`) to `requirements.txt`.

## Deployment

This Streamlit app is intended to be deployable on free-tier services, such as:

- **Hugging Face Spaces** (type: Streamlit).
- Other free Python hosting providers.

In all cases, the app should remain stateless and rely on the FastAPI backend for any non-trivial processing.