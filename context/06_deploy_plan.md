# 06 – Deploy plan (free-first)

This document outlines how to deploy the system using **free-tier** infrastructure, with a focus on Hugging Face Spaces and simple, reproducible processes.

## Objectives

- Keep all core components deployable using **free services** (no paid cloud required).
- Make deployments **simple to reproduce** by individual developers.
- Ensure the architecture remains **portable** to other providers if needed.

## Target environments

### 1. Gradio Space (ZeroGPU) – Cloud inference

- **Component**: `cloud_infer_gradio/`
- **Platform**: Hugging Face Spaces
- **Runtime**: Gradio + Python, using **ZeroGPU** once heavy models are added.
- **Deployment approach**:
  1. Create a new Hugging Face Space (type: Gradio).
  2. Copy or mirror the `cloud_infer_gradio/` directory into the Space.
  3. Ensure `requirements.txt` is honored by HF Spaces.
  4. Expose the main Gradio app object (for example, `demo`) from `app.py`.
  5. Once models are added, annotate GPU-heavy functions with `@spaces.GPU` to make use of ZeroGPU.
- **Notes**:
  - This Space will act as the **GPU inference service**.
  - It can run independently and be tested via the HF-hosted UI.

### 2. FastAPI backend – CPU-only Space or lightweight host

- **Component**: `api_web/backend/`
- **Platform options**:
  - Hugging Face Space (type: "Docker" or "Gradio/Streamlit" with FastAPI adapter).
  - Any free-tier container host (Fly.io, Render free tier, etc.).
- **Deployment approach (HF Space example)**:
  1. Create a new Hugging Face Space (e.g., type: Docker).
  2. Build a simple container image that:
     - Installs `api_web/backend/requirements.txt`.
     - Runs `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
  3. Configure Space hardware: CPU-only.
- **Responsibilities**:
  - Expose HTTP endpoints consumed by the web and mobile clients.
  - Use `gradio_client` in future revisions to call the Gradio Space.
- **Notes**:
  - Keeping this CPU-only makes it cheap/free to host.
  - API versioning and backward compatibility should be handled here.

### 3. Streamlit web UI – HF Space or equivalent

- **Component**: `api_web/web_streamlit/`
- **Platform**: Hugging Face Spaces (type: Streamlit) or other free Python hosting.
- **Deployment approach**:
  1. Create a new Hugging Face Space (type: Streamlit).
  2. Copy or mirror `api_web/web_streamlit/` into the Space.
  3. Ensure `requirements.txt` includes Streamlit and any HTTP client dependencies when the backend integration is added.
  4. Configure the Space to run `streamlit run app.py`.
- **Responsibilities**:
  - Provide a simple, public web UI for cartoonization.
  - Call the FastAPI backend (over HTTPS) once wired.
- **Notes**:
  - The Streamlit app should not hold secrets; it should talk to a public API URL.

### 4. Flutter mobile app – App stores

- **Component**: `mobile_app/`
- **Platform**:
  - Android: Google Play Store or sideloaded APK for early testing.
  - iOS: Apple App Store or TestFlight for early testing.
- **Deployment approach** (high level):
  1. Use `scripts/bootstrap_flutter_app.sh` and documentation to create a proper Flutter app.
  2. Integrate TFLite models for offline cartoonization (no network needed).
  3. Add HTTP client to call the FastAPI backend for cloud mode.
  4. Follow platform-specific guidelines for signing, packaging, and publishing.
- **Notes**:
  - The app should work offline by default (TFLite).
  - Cloud mode is an optional enhancement, not a requirement.

## Configuration and secrets

- No secrets are committed to the repo.
- Any required API keys or credentials (if introduced later) should be:
  - Passed via environment variables in hosting platforms.
  - Documented using a `.env.example` file (to be added when first needed).
- The initial deployment stages (v0.x) should work **without any secrets**, using only public endpoints.

## Deployment workflow (overview)

For early iterations:

1. **Prepare code**:
   - Ensure main branches are green in CI.
   - Tag releases in Git if desired (e.g., `v0.1.0`).

2. **Deploy Gradio Space**:
   - Push `cloud_infer_gradio/` to the HF Space.
   - Verify the UI works and returns images as expected (even with stub logic).

3. **Deploy FastAPI backend**:
   - Push `api_web/backend/` to a CPU-only HF Space or other free host.
   - Verify `/health` passes on the public URL.

4. **Wire integrations** (future):
   - Update FastAPI to call the Gradio Space via `gradio_client`.
   - Update Streamlit to call the FastAPI backend.
   - Update the Flutter app to call FastAPI for cloud mode.

5. **Deploy Streamlit Space**:
   - Push `api_web/web_streamlit/` to a Streamlit HF Space.
   - Configure it to target the FastAPI backend URL.
   - Smoke test the entire flow: upload image, trigger cartoonize, see response.

6. **Iterate and improve**:
   - Track deployment-related decisions in `context/03_decisions_log.md`.
   - Track changes in `context/04_change_log.md`.

## Monitoring and observability (future)

Even on free tiers, basic observability is valuable:

- **Logging**:
  - Leverage the structured logs from the FastAPI backend.
  - For simple setups, review logs in platform dashboards (HF Space logs, etc.).
- **Health checks**:
  - Use `/health` for monitoring and readiness probes where supported.
- **Metrics** (optional later):
  - If needed, add lightweight metrics via Prometheus or service-specific dashboards.
  - Keep any additional services free-tier compatible.

The deploy plan should remain **simple and reproducible** to encourage experimentation and community contributions.