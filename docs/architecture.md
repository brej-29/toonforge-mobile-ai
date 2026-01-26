# Architecture

This document complements `context/01_architecture.md` with a higher-level, narrative description of how the pieces of the system fit together.

## Overview

The **Mobile AI Cartoon Generation** system is designed around these principles:

- **Free-first**: Use free-tier infrastructure such as Hugging Face Spaces and on-device inference.
- **Multi-surface**: Support both web and mobile clients.
- **Separation of concerns**: Distinct responsibilities for inference, API, and UI.
- **Production-style from day one**: Logging, tests, CI, and clear documentation.

## Component diagram

```text
+----------------------------------------------------------+
|                      Clients                             |
|                                                          |
|  +------------------+     +---------------------------+  |
|  | Flutter Mobile   |     | Streamlit Web UI         |  |
|  | - Offline TFLite |     | - Browser-based UI       |  |
|  | - Cloud via API  |     | - Calls FastAPI backend  |  |
|  +---------+--------+     +-------------+------------+  |
|            |                                |           |
+------------|--------------------------------|-----------+
             | HTTP (JSON)                    |
             v                                v
+------------+--------------------------------+-----------+
|                  FastAPI Backend (CPU)                  |
|  - Stable REST API                                      |
|  - Validation, logging, error handling                  |
|  - Calls Gradio Space via gradio_client (future)        |
+------------+--------------------------------------------+
             |
             | Python client (gradio_client)
             v
+------------+--------------------------------------------+
|          Gradio Space (ZeroGPU, GPU inference)          |
|  - Hosts heavy cartoonization models                    |
|  - Exposed as a Gradio interface                        |
+---------------------------------------------------------+

+---------------------------------------------------------+
|                     Model Registry                      |
|  - Metadata in models/MODEL_REGISTRY.md                 |
|  - No weights in the repo                               |
+---------------------------------------------------------+
```

## Data flow

1. **User action**:
   - On web: User opens the Streamlit app, uploads an image, and clicks "Cartoonize".
   - On mobile: User captures or selects an image in the Flutter app and chooses offline or cloud mode.

2. **Offline path (mobile only, future)**:
   - Flutter app runs the image through a local TFLite model.
   - The result is rendered on-device and optionally cached or shared.

3. **Cloud path**:
   - Client (Streamlit or Flutter) sends a request to the FastAPI backend.
   - FastAPI validates the request, logs structured context, and forwards it to the Gradio Space using `gradio_client` (future).
   - The Gradio Space performs GPU-accelerated cartoonization and returns the result to FastAPI.
   - FastAPI normalizes and returns the response to the client.

4. **Observability**:
   - FastAPI emits structured logs for incoming requests, outgoing Gradio calls, and errors.
   - Over time, request IDs and correlation IDs can be added.

## Why these technologies?

### Gradio + Hugging Face Spaces (ZeroGPU)

- Gradio provides:
  - Rapid prototyping for model UIs.
  - Built-in HF Space integration.
- ZeroGPU provides:
  - Free access to GPU resources for short, bursty workloads.
  - A good fit for inference-heavy cartoonization models.

### FastAPI

- Strong typing and automatic documentation (OpenAPI).
- Excellent performance and async support.
- Clear separation between API contract and model/backend implementation.

### Streamlit

- Easy to build and iterate on web UIs in Python.
- Friendly for experimentation and demos.
- Integrates well in a Python-based monorepo.

### Flutter + TFLite

- Single codebase for Android and iOS.
- TFLite supports efficient on-device inference on a wide range of devices.
- Enables offline usage, reducing dependence on cloud infrastructure.

## Monorepo rationale

Using a monorepo:

- Encourages shared tooling (CI, linting, formatting).
- Keeps architecture, decisions, and implementation aligned over time.
- Simplifies cross-component refactors (for example, changing APIs used by both web and mobile).

Directory-level responsibilities:

- `cloud_infer_gradio/`: GPU-oriented model serving.
- `api_web/backend/`: Core API and orchestration.
- `api_web/web_streamlit/`: Browser UI.
- `mobile_app/`: Mobile bootstrap and, later, full Flutter app.
- `models/`: Registry and metadata, not weights.
- `docs/` and `context/`: Documentation and living spec.

## Future considerations

- **Security**:
  - Auth mechanisms for the API (API keys, OAuth, or simple tokens).
  - Rate limiting and abuse prevention for public endpoints.
- **Scalability**:
  - Moving from free-tier to low-cost paid tiers if needed.
  - Caching frequently used styles or models.
- **Extensibility**:
  - Supporting multiple cartoon styles or models.
  - Adding user accounts, galleries, or sharing features.
- **Governance**:
  - Keeping decisions and changes documented in `context/`.
  - Establishing contribution processes for community growth.