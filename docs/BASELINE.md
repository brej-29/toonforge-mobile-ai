# Starting-state audit

Audit date: 2026-11-05. Starting default branch: `main`, commit `12669907259d53196f2d6e8a20f244ce6ac725c1`. The rebuild uses an isolated feature worktree; existing deletions and generated mobile files in the original checkout were left untouched.

## Original intent and what survived

The original README describes a Flutter photo cartoonizer, a Streamlit web client, FastAPI, a Gradio cloud adapter, and a TFLite model toolkit. History confirms the progression: `0d1ece3` introduces the service scaffold; `828c704` adds model download/conversion/benchmarking; `9aaded1` adds actual API routes; `725412a` stops automatic local model downloads because an upstream response could be HTML rather than a model. Photo simplification and offline operation are useful product ideas. Maintaining four user-facing/service runtimes without a working model artifact is the part the rebuild replaces.

The model registry has logical fp16/int8 entries, but no committed weights or measured benchmark artifacts. Its license notes defer to upstream licenses; it does not establish permission to redistribute a specific model. No sibling repository is referenced by the original setup: the API, web client, cloud adapter, and mobile app are all in this monorepo.

## Installation and real requests

Created a new project-local environment with CPython 3.12.13. Installed the original API requirements, `httpx` for the test client, and the local model package:

```powershell
uv venv .venv --python 3.12
uv pip install --python .venv/Scripts/python.exe -r api_web/backend/requirements.txt httpx -e models/cartoonizer
$env:PYTHONPATH='api_web/backend'
.venv/Scripts/python.exe -m pytest api_web/backend/tests -q
```

Observed: **5 passed in 5.14s**. Resolved versions included FastAPI 0.162.0, Pillow 13.0.0, pytest 9.2.0, and gradio-client 2.7.2. Requirements use lower bounds rather than a lockfile, so future resolution can differ. This is a successful install, not an install failure.

Then sent an actual Pillow-encoded 64×64 PNG through `TestClient`; neither processing service was monkeypatched:

```python
from fastapi.testclient import TestClient
from app.main import app
from PIL import Image
from io import BytesIO

buffer = BytesIO()
Image.new("RGB", (64, 64), (80, 120, 180)).save(buffer, format="PNG")
client = TestClient(app)
for mode in ["local", "cloud"]:
    response = client.post(
        "/v1/cartoonize",
        data={"mode": mode, "model_variant": "fp16", "output": "png"},
        files={"image": ("real.png", buffer.getvalue(), "image/png")},
    )
    print(mode, response.status_code, response.json())
```

| Request | Observed result |
| --- | --- |
| `GET /health` | 200, `status: ok`, version `0.0.0` |
| `GET /version` | 200, version `0.0.0`, API `v1`, no git SHA |
| `GET /v1/models` | 200, advertises local/cloud and fp16/int8 |
| `POST /v1/cartoonize`, local | 500: `Local cartoonization is not configured. Install the 'cartoonizer' package and its runtime dependencies (numpy, pillow, opencv, tflite-runtime or tensorflow).` |
| `POST /v1/cartoonize`, cloud | 500: `Cloud cartoonization is not configured. Set GRADIO_SPACE_ID to enable cloud mode.` |

After `uv pip install --python .venv/Scripts/python.exe numpy opencv-python-headless`, the same local request reached a more specific failure: **500**, `Local cartoonization model 'cartoongan-fp16' not found at '…/models/artifacts/downloaded/cartoongan-fp16.tflite'`. This confirms the missing artifact independently of the initial dependency error. No upstream model was downloaded, no cloud account was created, and no paid runtime was used.

## Why the green baseline was insufficient

At the starting commit, `api_web/backend/tests/test_meta_and_cartoonize.py::test_cartoonize_local_happy_path` replaces the processing function with one returning the literal bytes `b"pngbytes"` and fixed latency values. That test checks route wiring and response headers; it does not establish that the returned bytes decode as an image. The actual core-job baseline is **0 successful PNG outputs from 2 configured-mode attempts**, a configuration-completeness result rather than an aesthetic quality score or a general reliability estimate.

The new evaluation therefore separates deterministic processing quality, correctness, browser file handling, and deployed end-to-end export. The original stack is recoverable from the starting commit and backup tag; keeping its unfinished modes visible in the new product would misrepresent availability.
