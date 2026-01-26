# API contract

This document describes the HTTP API exposed by the FastAPI backend under `api_web/backend/`.

Base URL is environment-dependent; examples assume:

```text
http://127.0.0.1:8000
```

---

## 1. `GET /health`

Simple health check for liveness and basic diagnostics.

### Request

```http
GET /health HTTP/1.1
Host: 127.0.0.1:8000
```

### Response

```json
{
  "status": "ok",
  "service": "Mobile AI Cartoon Generation API",
  "version": "0.0.0",
  "environment": "local"
}
```

---

## 2. `GET /version`

Returns version metadata for the backend.

### Request

```http
GET /version HTTP/1.1
Host: 127.0.0.1:8000
```

### Response

```json
{
  "version": "0.2.0",
  "api_version": "v1",
  "git_sha": "abc123def"  // may be null if not set
}
```

Environment variables used:

- `APP_VERSION` → `version`
- `API_VERSION` → `api_version`
- `GIT_SHA` → `git_sha`

---

## 3. `GET /v1/models`

Returns supported cartoonization modes and model variants.

### Request

```http
GET /v1/models HTTP/1.1
Host: 127.0.0.1:8000
```

### Response

```json
{
  "modes": [
    {
      "id": "local",
      "description": "Local CPU TFLite inference using cached models."
    },
    {
      "id": "cloud",
      "description": "Cloud inference via Gradio Space using gradio_client (ZeroGPU optional)."
    }
  ],
  "variants": [
    {
      "id": "fp16",
      "description": "Float16-optimized TFLite model."
    },
    {
      "id": "int8",
      "description": "Int8-quantized TFLite model (smaller, faster)."
    }
  ]
}
```

---

## 4. `POST /v1/cartoonize`

Cartoonizes an uploaded image using either local TFLite inference or a Gradio Space in the cloud.

### Request

- **Method**: `POST`
- **Path**: `/v1/cartoonize`
- **Content type**: `multipart/form-data`

Form fields:

- `mode`: `"local"` or `"cloud"` (default: `"local"`).
- `model_variant`: `"fp16"` or `"int8"` (default: `"fp16"`).
- `output`: `"png"` (default, current-only option).

File field:

- `image`: the image file to cartoonize.
  - Content types: `image/png`, `image/jpeg`, etc.

Optional headers:

- `x-ip-token`: forwarded to the Gradio Space client when `mode=cloud` (for ZeroGPU/IP-specific routing, if used).

Example (local mode):

```bash
curl -X POST "http://127.0.0.1:8000/v1/cartoonize" \
  -F "mode=local" \
  -F "model_variant=fp16" \
  -F "output=png" \
  -F "image=@/path/to/input.jpg;type=image/jpeg" \
  -o cartoonized.png
```

Example (cloud mode):

```bash
curl -X POST "http://127.0.0.1:8000/v1/cartoonize" \
  -F "mode=cloud" \
  -F "model_variant=int8" \
  -F "output=png" \
  -F "image=@/path/to/input.jpg;type=image/jpeg" \
  -o cartoonized.png
```

### Response

- **Status**: `200 OK` on success.
- **Body**: `image/png` bytes (cartoonized image).
- **Headers**:
  - `x-latency-total-ms` – total end-to-end processing time (ms).
  - `x-latency-infer-ms` – inference time (ms) when available (local mode).
  - `x-mode` – `"local"` or `"cloud"` as processed.
  - `x-variant` – `"fp16"` or `"int8"` as processed.

Example response headers:

```http
HTTP/1.1 200 OK
content-type: image/png
x-latency-total-ms: 123.45
x-latency-infer-ms: 78.90
x-mode: local
x-variant: fp16
```

### Error responses

- `400 Bad Request` – invalid parameters or upload issues.
  - Examples:
    - Non-image file.
    - File too large (controlled by `MAX_UPLOAD_MB` environment variable).
    - Unsupported `output` value (currently anything other than `"png"`).
- `422 Unprocessable Entity` – validation errors (e.g., invalid `mode` literal in form data).
- `500 Internal Server Error` – unexpected internal error.
- `502 Bad Gateway` – upstream Gradio Space failure when `mode=cloud`.

Error payload (JSON):

```json
{
  "detail": "Human-readable error message"
}
```

The backend uses structured logging and centralized error handling. Application-level errors are represented by `APIError` and mapped to HTTP responses with consistent JSON bodies.

---

## 5. Usage from clients

### 5.1 Streamlit web UI

The Streamlit app (`api_web/web_streamlit/app.py`) acts as an HTTP client:

- Reads `API_BASE_URL` from environment (default `http://127.0.0.1:8000`).
- Performs `POST /v1/cartoonize` with `mode`, `model_variant`, and `image`.
- Displays:
  - Returned PNG image.
  - Latency headers `x-latency-total-ms` and `x-latency-infer-ms`.
- Shows friendly error messages if the request fails or the backend returns errors.

### 5.2 Flutter mobile app

The ToonForge Flutter app (`mobile_app/toonforge_app/`) uses `http.MultipartRequest` to:

- Send the image as `image` field.
- Set `mode=cloud` for cloud mode.
- Set `model_variant` based on user settings.
- Parse PNG bytes from the response and display the result.
- Inspect latency headers for UX metrics.

Offline mode (TFLite) does not use the backend and is handled entirely on device.

---

## 6. Configuration summary

Environment variables relevant to the API:

- `APP_NAME` – service name (for `/health`).
- `APP_VERSION` – application version.
- `API_VERSION` – public API version string (e.g. `v1`).
- `GIT_SHA` – optional git SHA for traceability.
- `GRADIO_SPACE_ID` – HF Space ID for cloud mode (e.g. `username/toonforge-cartoonizer`).
- `GRADIO_API_NAME` – API name within the Gradio Space (default `/predict`).
- `MODEL_CACHE_DIR` – local directory for cached TFLite models (for local mode).
- `MAX_UPLOAD_MB` – maximum upload size for images (default 10 MB).

Clients (Streamlit, mobile) should not need to know about Gradio directly; they talk only to the FastAPI backend using this contract.