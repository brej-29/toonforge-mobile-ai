v0.0.0 scaffold created

# 04 – Change log

This change log tracks notable changes to the repository. It is intentionally high-level and complements version control history.

The format loosely follows semantic versioning, starting at `v0.0.0` for the initial scaffold.

---

## v0.0.0 – Scaffold created

- Created initial monorepo structure:
  - `cloud_infer_gradio/` for Gradio-based cloud inference.
  - `api_web/backend/` for the FastAPI backend.
  - `api_web/web_streamlit/` for the Streamlit web UI.
  - `mobile_app/` for Flutter bootstrap guidance.
  - `models/` for the model registry.
  - `docs/` for documentation.
  - `context/` for project context and governance.
- Added initial CI workflows:
  - `python-ci.yml` for backend tests and linting.
  - `repo-lint.yml` for repository-level checks.
- Added base tooling:
  - `.pre-commit-config.yaml` with black, ruff, and basic checks.
  - `Makefile` with helper commands (`setup`, `api`, `web`, `gradio`, `test`, `lint`).
- Seeded context documents:
  - Project goal, architecture, components, decisions log, change log, test plan, deploy plan, Cosine task log.

## v0.1.0 – Model POC + TFLite pipeline

- Implemented a standalone cartoonizer model package under `models/cartoonizer/` with:
  - Structured logging and a single CLI entry point: `python -m cartoonizer <command>`.
  - Commands for `download`, `infer`, `benchmark`, and `convert`.
- Added a complete inference pipeline:
  - Downloads TFLite models from TF Hub using the `?lite-format=tflite` convention.
  - Runs TFLite inference on local images with consistent preprocessing/postprocessing (BGR, [-1, 1] normalization).
  - Saves outputs and logs preprocessing, inference, and total latency.
- Added a conversion + optimization pipeline:
  - Converts SavedModels to TFLite `fp32`, `fp16`, and `int8` variants.
  - Supports dynamic range int8 and full integer quantization with a representative dataset.
  - Writes per-variant metadata JSON with converter options, tensor info, size, checksum, and timestamps.
- Added benchmarking support:
  - Benchmarks TFLite models and writes JSON reports under `models/artifacts/benchmarks/`.
  - Reports p50, p95, mean, and standard deviation of inference latency, plus model size.
- Introduced a gitignored artifacts layout under `models/artifacts/` for:
  - `downloaded/` TFLite models,
  - `converted/` variants,
  - `benchmarks/` reports.
- Extended CI:
  - Added a `cartoonizer-ci` job that lints and tests `models/cartoonizer/` without downloading models or requiring heavy optional dependencies by default.
- Updated documentation:
  - `models/MODEL_REGISTRY.md` with entries for TF Hub CartoonGAN fp16/int8 and converted variants.
  - `docs/model_pipeline.md` describing download, inference, conversion/quantization, benchmarking, and future Flutter integration.
  - `context/03_decisions_log.md` with decisions for TF Hub downloads, gitignored artifacts, runtime/quantization choices, and AnimeGANv2 licensing considerations.
  - `context/05_test_plan.md` with tests added and the rationale for keeping CI light.

## v0.2.0 – End-to-end app wiring (web, API, cloud, mobile)

- Upgraded the Gradio Space (`cloud_infer_gradio/`) from a stub to a CPU-first TFLite cartoonizer:
  - Uses the shared `cartoonizer` package to download and cache TFLite models from TF Hub.
  - Exposes a variant selector (`fp16`, `int8`) and latency metrics.
  - Includes an optional `@spaces.GPU` decorator for ZeroGPU, with CPU as the default.
- Expanded the FastAPI backend (`api_web/backend/`) into a stable API layer:
  - Added `/version` and `/v1/models` metadata endpoints.
  - Added `/v1/cartoonize` with multipart upload, `mode=local|cloud`, and `model_variant=fp16|int8`.
  - Implemented local TFLite inference via the cartoonizer pipeline (when installed) with a model cache directory.
  - Implemented cloud mode using `gradio_client` to call the Gradio Space, with optional `x-ip-token` forwarding.
  - Added structured JSON-like logging and centralized error handling for all new routes.
  - Added tests for `/version`, `/v1/models`, and `/v1/cartoonize` validation behavior.
- Wired the Streamlit web UI (`api_web/web_streamlit/`) to the backend:
  - Image upload + mode and variant selection.
  - Calls FastAPI `/v1/cartoonize` via `requests` and displays the returned PNG.
  - Shows latency headers and provides a download button.
- Introduced a real Flutter app (`mobile_app/toonforge_app/`):
  - Offline TFLite inference using `tflite_flutter` in an isolate.
  - Cloud mode calling FastAPI `/v1/cartoonize`.
  - Settings screen powered by `SharedPreferences` for API base URL, default mode, and model variant.
  - Scripts to copy `.tflite` models from `models/artifacts/downloaded/` into app assets.
  - Structured logging in Dart (JSON-like print output).
- Added docs and tooling:
  - `docs/deployment_hf.md` for deploying Gradio, FastAPI, and Streamlit to Hugging Face Spaces.
  - `docs/mobile_build.md` for local Flutter builds, store fees, and free distribution options.
  - `docs/api_contract.md` documenting `/health`, `/version`, `/v1/models`, and `/v1/cartoonize`.
  - Updated root `README.md` with the final architecture and run instructions.
  - Added `docker-compose.yml` for local API + Streamlit composition.
  - Extended `Makefile` with a `mobile` target that prints Flutter run instructions.
- Updated context:
  - `context/01_architecture.md` and `context/02_components.md` to reflect the end-to-end system.
  - `context/03_decisions_log.md` with decisions on CPU-first Gradio, optional ZeroGPU, FastAPI wrapper, mobile offline-first design, and artifact handling.
  - `context/05_test_plan.md` and `context/06_deploy_plan.md` to capture new tests and deploy flows.
  - `context/07_cosine_task_log.md` with this end-to-end wiring task.