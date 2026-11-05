# Cartoonizer model pipeline

This package implements the **Step 1 + Step 2** model pipeline for the Mobile AI Cartoon Generation project:

1. **Inference pipeline (Step 1)** – Download a ready-to-use cartoonization `.tflite` model, run inference on a local image, save the result, and log latency and metadata.
2. **Conversion + optimization pipeline (Step 2)** – Convert a TensorFlow SavedModel to TFLite, generate optimized variants (fp32 baseline, fp16, int8), and benchmark their size and latency.

The package is designed to be:

- **Free-first** – Uses TF Hub and CPU-only pipelines.
- **Reproducible** – Deterministic outputs, fully scripted flows.
- **Production-style** – Typed Python, structured logging, tests, and clear CLI.

## Layout

```text
models/cartoonizer/
├─ README.md
├─ requirements.txt
├─ pyproject.toml
├─ src/cartoonizer/
│  ├─ __init__.py
│  ├─ __main__.py
│  ├─ constants.py
│  ├─ logging_config.py
│  ├─ io_images.py
│  ├─ preprocess.py
│  ├─ postprocess.py
│  ├─ tflite_runner.py
│  ├─ download.py
│  ├─ infer.py
│  ├─ benchmark.py
│  ├─ convert_savedmodel.py
│  ├─ quantize.py
│  └─ registry.py
├─ tests/
│  ├─ test_cli_smoke.py
│  ├─ test_preprocess_postprocess.py
│  └─ test_registry_format.py
└─ scripts/
   ├─ run_infer_example.sh
   ├─ run_benchmark_example.sh
   └─ run_convert_example.sh
```

The pipeline stores artifacts under:

```text
models/artifacts/
  ├─ downloaded/   # Raw TFLite files from TF Hub
  ├─ converted/    # Converted / quantized variants from SavedModels
  └─ benchmarks/   # JSON benchmark results
```

This directory is gitignored to avoid committing model binaries.

## Installation

From the repository root:

```bash
cd models/cartoonizer
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

pip install -r requirements.txt
# Optional: install extra tools for conversion
# pip install tensorflow huggingface_hub tflite-runtime
```

For a more traditional workflow, you can install the package in editable mode:

```bash
pip install -e .
```

After that, the CLI entry point works from anywhere:

```bash
python -m cartoonizer --help
```

## CLI usage

All commands share a single entry point:

```bash
python -m cartoonizer <command> [options]
```

Commands:

- `download` – Download prebuilt TFLite models from TF Hub.
- `infer` – Run inference on a local image with a TFLite model.
- `benchmark` – Benchmark latency and size of a TFLite model.
- `convert` – Convert a SavedModel to TFLite variants (fp32, fp16, int8).

### 1. Download (TF Hub, lite-format)

Downloads prebuilt TFLite models from TF Hub using the convention:

```text
https://tfhub.dev/<publisher>/lite-model/<model>/<variant>/<version>?lite-format=tflite
```

Example:

```bash
cd models/cartoonizer
python -m cartoonizer download --model-id cartoongan-fp16
```

This will:

- Build the TF Hub URL using the `?lite-format=tflite` query.
- Download the `.tflite` file into `models/artifacts/downloaded/`.
- Save a JSON sidecar with:
  - source URL
  - sha256 checksum
  - download timestamp
  - file size (bytes)

Supported model IDs (initially):

- `cartoongan-fp16`
- `cartoongan-int8`

Note: the actual TF Hub paths for cartoonization models may evolve; the mapping from `model-id` to TF Hub URL is defined in `registry.py` and can be updated without changing the CLI.

### 2. Inference

Run inference on a local image:

```bash
cd models/cartoonizer
python -m cartoonizer infer \
  --model ../artifacts/downloaded/cartoongan-fp16.tflite \
  --input /path/to/input.jpg \
  --output /path/to/output_cartoon.jpg \
  --max_size 720 \
  --force_bgr true \
  --resize_mode fit
```

Behavior:

- Loads the TFLite model via `tflite-runtime` if available; otherwise falls back to TensorFlow’s TFLite interpreter.
- Reads the input image, resizes it according to `--max_size` and `--resize_mode`.
- Applies preprocessing consistent with White-box CartoonGAN norms:
  - RGB → BGR if `--force_bgr true`.
  - Normalize to `[-1, 1]` as `float32`.
- Runs inference and postprocesses:
  - De-normalize from `[-1, 1]` to `[0, 255]` `uint8`.
  - Convert back to RGB if BGR was used.
- Saves the output image deterministically.

Logs include:

- Model path.
- Input and output tensor shapes.
- Preprocessing time (ms).
- Inference time (ms).
- Total pipeline time (ms).

### 3. Benchmark

Benchmark a TFLite model:

```bash
cd models/cartoonizer
python -m cartoonizer benchmark \
  --model ../artifacts/downloaded/cartoongan-fp16.tflite \
  --input /path/to/input.jpg \
  --runs 50 \
  --warmup 5
```

This will:

- Run a few warmup passes.
- Run multiple timed inferences.
- Compute:
  - `p50` (median) latency.
  - `p95` latency.
  - Mean and standard deviation.
  - Model size in bytes.
- Save a JSON report under `models/artifacts/benchmarks/`.

### 4. Convert + quantize

Convert a SavedModel to TFLite variants:

```bash
cd models/cartoonizer

# Local SavedModel path
python -m cartoonizer convert \
  --savedmodel /path/to/saved_model \
  --out_dir ../artifacts/converted/my_cartoongan \
  --variants fp32,fp16,int8
```

Or, using a Hugging Face Hub model ID that contains a SavedModel:

```bash
python -m cartoonizer convert \
  --savedmodel my-org/cartoonizer-savedmodel \
  --out_dir ../artifacts/converted/my_cartoongan \
  --variants fp32,fp16,int8
```

For `int8`, you can optionally provide a representative dataset directory to enable full integer quantization:

```bash
python -m cartoonizer convert \
  --savedmodel /path/to/saved_model \
  --out_dir ../artifacts/converted/my_cartoongan \
  --variants int8 \
  --representative_data_dir /path/to/representative/images
```

Conversion notes:

- `fp32` – baseline TFLite conversion (no quantization).
- `fp16` – post-training float16 quantization (smaller, usually good quality).
- `int8` – dynamic range quantization by default; full integer quantization if a representative dataset is provided.

Each variant writes metadata JSON with:

- Converter options used.
- Input/output tensor info (from the generated TFLite model).
- File size and SHA256 checksum.
- Timestamp.

If TensorFlow or `huggingface_hub` are not installed and you call `convert`, you will get a clear error explaining which dependency is missing.

## Logging and error handling

- Logging is configured via `logging_config.py` to use JSON-like structured logs on stdout.
- CLI commands log key events (downloads, inference, benchmarking, conversion) with module name, level, and key fields.
- Custom exceptions ensure user-friendly error messages, especially around:
  - Missing models.
  - Missing optional dependencies (`tflite-runtime`, `tensorflow`, `huggingface_hub`).
  - Shape or dtype mismatches between the preprocessed input and model expectations.

## Tests

Tests live in `tests/`:

- `test_cli_smoke.py` – Validates CLI parsing and basic commands (no network or heavy deps).
- `test_preprocess_postprocess.py` – Verifies preprocessing/postprocessing normalization and shape behavior.
- `test_registry_format.py` – Ensures the in-code registry entries meet the expected structure.

Tests are designed **not** to download models or require TensorFlow/TFLite so that CI remains fast and reliable.

## Relationship to the rest of the repo

- This package is the **model-side** implementation for:
  - Cloud Gradio inference (future integration).
  - Flutter TFLite inference (future integration via `tflite_flutter`).
- The high-level pipeline is documented in `docs/model_pipeline.md`.
- Model entries and decisions flow into:
  - `models/MODEL_REGISTRY.md`
  - `context/03_decisions_log.md`
  - `context/04_change_log.md`
  - `context/05_test_plan.md`

This keeps the model work fully traceable and aligned with the overall project architecture.