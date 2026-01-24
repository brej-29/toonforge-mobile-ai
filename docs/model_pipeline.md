# Model pipeline

This document describes the **Step 1 + Step 2** model pipeline implemented under `models/cartoonizer/` for the Mobile AI Cartoon Generation project.

It covers:

- Downloading ready-to-use cartoonization `.tflite` models (TF Hub).
- Running local inference with TFLite on CPU.
- Converting SavedModels to TFLite (fp32 baseline + fp16 + int8).
- Benchmarking latency and size across variants.
- How this will integrate into the wider system (Gradio / Flutter).

The design is informed by the official TensorFlow Lite cartoonizer tutorial (White-box CartoonGAN) and TensorFlow’s post-training quantization patterns, but kept lighter and free-first.

---

## 1. Download: TF Hub TFLite models

### Convention

We follow the official TF Hub convention for downloading TFLite models:

```text
https://tfhub.dev/<publisher>/lite-model/<model>/<variant>/<version>?lite-format=tflite
```

The `?lite-format=tflite` query is appended to ensure we get the TFLite artifact.

### Implementation

- Code lives in `models/cartoonizer/src/cartoonizer/download.py`.
- Known models and their TF Hub IDs are defined in `cartoonizer/constants.py` and exposed via `cartoonizer/registry.py`.
- Artifacts are written under:

  ```text
  models/artifacts/downloaded/
  ```

- For each downloaded model:
  - The `.tflite` file is saved (e.g. `cartoongan-fp16.tflite`).
  - A JSON sidecar is created with:
    - `source_url` (the TF Hub URL with `?lite-format=tflite`).
    - `sha256` checksum.
    - `size_bytes`.
    - `downloaded_at` timestamp (UTC).

### CLI usage

```bash
cd models/cartoonizer
python -m cartoonizer download --model-id cartoongan-fp16
python -m cartoonizer download --model-id cartoongan-int8
# or download all known models:
python -m cartoonizer download --model-id all
```

The list of model IDs is maintained in `cartoonizer/registry.py`.

---

## 2. Inference: TFLite cartoonizer on CPU

### TFLite runtime selection

- The runtime prefers **tflite-runtime** for lightweight CPU inference.
- If `tflite-runtime` is not installed, it falls back to TensorFlow’s `tf.lite.Interpreter`.
- If neither is available, the CLI prints a clear error explaining that one of these must be installed to run inference.

The interpreter wrapper lives in `cartoonizer/tflite_runner.py`:

- Inspects input/output tensor details.
- Enforces `float32` input type for now (raises a clear error otherwise).
- Provides an API to run inference and query expected input shapes.

### Preprocessing and postprocessing

Based on White-box CartoonGAN / CartoonGAN norms (as described in the TensorFlow Lite cartoonizer tutorial):

- **Input expectations**:
  - Shape: `1 x H x W x 3`, typically `1 x 256 x 256 x 3`.
  - Channel order: BGR.
  - Value range: `[-1, 1]` in `float32`.

**Preprocessing** (`cartoonizer/preprocess.py`):

1. Load RGB image as `uint8` using Pillow → NumPy.
2. Resize:
   - Target size derived from model profile (default: 256x256) and `--max_size`.
   - `--resize_mode fit` (default): resize directly to target size.
   - `--resize_mode crop`: scale and center-crop to target.
3. Channel ordering:
   - If `--force_bgr true`: convert RGB → BGR.
4. Normalize:
   - Scale to `[0, 1]`, then to `[-1, 1]`.
5. Add batch dimension:
   - Shape becomes `(1, H, W, 3)` of `float32`.

**Postprocessing** (`cartoonizer/postprocess.py`):

1. Remove batch dimension.
2. De-normalize:
   - `[-1, 1]` → `[0, 255]` `uint8`.
3. Channel ordering:
   - If BGR was used, convert BGR → RGB.
4. Optional resize:
   - Resize back to the original image size so that output matches original dimensions.

Both preprocessing and postprocessing functions return **result objects** that include timing (ms), so the CLI can log per-stage latency.

### CLI usage

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

The `infer` command:

- Loads the TFLite model and inspects its expected input shape.
- Preprocesses the image consistently with the model profile.
- Runs inference on CPU.
- Postprocesses and saves the output image.
- Logs:
  - Model path.
  - Input and output shapes.
  - Preprocessing, inference, and postprocessing times (ms).
  - Total end-to-end latency.

---

## 3. Conversion and quantization (SavedModel → TFLite)

The conversion pipeline implements **fp32 baseline**, **fp16**, and **int8** variants using official TensorFlow Lite post-training quantization patterns.

### Sources: local path or Hugging Face Hub

- `--savedmodel SOURCE` can be:
  - A local path to a SavedModel directory.
  - A Hugging Face Hub model ID containing a SavedModel (`saved_model.pb`).

When HF IDs are used:

- The code uses `huggingface_hub.snapshot_download` (optional dependency).
- If `huggingface_hub` is not installed and an HF ID is provided, the CLI prints a helpful error.

### Variants

All variants are produced via TensorFlow’s `tf.lite.TFLiteConverter`:

1. **fp32 baseline**:
   - No quantization, default settings.
   - Highest fidelity, largest size.

2. **fp16 (float16)**:
   - `converter.optimizations = [tf.lite.Optimize.DEFAULT]`.
   - `converter.target_spec.supported_types = [tf.float16]`.
   - Good quality with significantly reduced size.

3. **int8**:
   - `converter.optimizations = [tf.lite.Optimize.DEFAULT]`.
   - If **no** representative dataset:
     - Dynamic range quantization (weights quantized; activations at runtime).
   - If a representative dataset directory is provided (`--representative_data_dir`):
     - Full integer quantization, using images from the directory as calibration data.
     - Input/output types set to `int8` as appropriate.

Quantization logic lives in `cartoonizer/quantize.py`. The CLI integration and metadata writing live in `cartoonizer/convert_savedmodel.py`.

### Outputs and metadata

The conversion pipeline writes outputs under:

```text
models/artifacts/converted/<model_name>/
    model_fp32.tflite
    model_fp32_metadata.json
    model_fp16.tflite
    model_fp16_metadata.json
    model_int8.tflite
    model_int8_metadata.json
```

Each `*_metadata.json` includes:

- Variant type (`fp32`, `fp16`, or `int8`).
- Path and size in bytes.
- SHA256 checksum.
- Input/output tensor info (shape, dtype) from the generated TFLite model.
- Converter options used (optimization, representative dataset path, inference type).
- Timestamp.

### CLI usage

```bash
cd models/cartoonizer

# Local SavedModel directory
python -m cartoonizer convert \
  --savedmodel /path/to/saved_model \
  --out_dir ../artifacts/converted/my_cartoongan \
  --variants fp32,fp16,int8

# With representative dataset for full integer quantization
python -m cartoonizer convert \
  --savedmodel /path/to/saved_model \
  --out_dir ../artifacts/converted/my_cartoongan \
  --variants int8 \
  --representative_data_dir /path/to/representative/images

# Hugging Face model ID
python -m cartoonizer convert \
  --savedmodel my-org/cartoonizer-savedmodel \
  --out_dir ../artifacts/converted/my_cartoongan \
  --variants fp32,fp16,int8
```

If TensorFlow is not installed and `convert` is invoked, the CLI raises a clear error recommending `pip install tensorflow`.

---

## 4. Benchmarking

Benchmarking focuses on **inference latency** and **model size** for a given TFLite model.

### Implementation

- Code lives in `cartoonizer/benchmark.py`.
- Uses the same preprocessing and TFLite runtime as the `infer` command.
- Steps:
  1. Load image and preprocess once.
  2. Run a configurable number of warmup runs (`--warmup`, e.g. 5).
  3. Run a configurable number of timed runs (`--runs`, e.g. 50).
  4. Compute statistics on the inference times:
     - p50 (median).
     - p95.
     - Mean.
     - Standard deviation.
  5. Record the model size in bytes.

### Outputs

Reports are written to:

```text
models/artifacts/benchmarks/<model_basename>_benchmark.json
```

Each report includes:

- Model path.
- Input image path.
- Number of runs and warmup iterations.
- Latency stats (ms): `p50`, `p95`, `mean`, `stdev`.
- Model size (bytes).
- Timestamp.

### CLI usage

```bash
cd models/cartoonizer
python -m cartoonizer benchmark \
  --model ../artifacts/downloaded/cartoongan-fp16.tflite \
  --input /path/to/input.jpg \
  --runs 50 \
  --warmup 5
```

These benchmark results are referenced in `models/MODEL_REGISTRY.md` and can inform which variant is best suited for offline mobile use vs. cloud inference.

---

## 5. Artifacts directory and gitignore

All model artifacts are stored under:

```text
models/artifacts/
  ├─ downloaded/
  ├─ converted/
  └─ benchmarks/
```

The entire `models/artifacts/` directory is gitignored to avoid committing large binaries. This fits the project’s principle:

- **Code and metadata in git; large artifacts regenerated on demand.**

---

## 6. Integration with other components

### Gradio (cloud inference)

- The Gradio Space can load either:
  - A TF Hub TFLite model downloaded via this pipeline, or
  - A converted/quantized TFLite model.
- The TFLite runner and preprocessing logic can be reused or mirrored in the Gradio app to keep behavior consistent.
- Heavy GPU models (e.g. large CartoonGAN variants) will run under ZeroGPU, but the input/output contract mirrors the cartoonizer package.

### Flutter (offline TFLite)

- The Flutter app (via `tflite_flutter`) will:
  - Embed one or more of the TFLite variants (e.g. fp16 or int8).
  - Implement preprocessing and postprocessing equivalent to the Python pipeline:
    - RGB ↔ BGR conversion if required.
    - Normalization and de-normalization between `[0, 255]` and `[-1, 1]`.
- Benchmarks from this pipeline guide:
  - Which variants to ship by default (e.g. int8 for low-end devices).
  - Whether additional quantization or model pruning is necessary.

---

## 7. Licensing considerations

- The pipeline is designed to work with CartoonGAN-style models that are suitable for free and commercial use.
- Some popular alternatives (e.g. AnimeGANv2) have licenses that may restrict commercial usage, so they are **not** used as defaults.
- Any model included in `models/MODEL_REGISTRY.md` should have:
  - Clear licensing notes.
  - Explicit warnings if commercial use is restricted.

---

## 8. Testing and CI

Tests specific to this pipeline live in `models/cartoonizer/tests/`:

- `test_cli_smoke.py` – ensures the CLI entry point is wired correctly.
- `test_preprocess_postprocess.py` – checks core image normalization and shape handling.
- `test_registry_format.py` – validates registry entries and TF Hub URL construction.

CI (`python-ci.yml`) includes a dedicated `cartoonizer-ci` job that:

- Installs only the lightweight dependencies from `models/cartoonizer/requirements.txt`.
- Runs `ruff` + `black --check` on `src/` and `tests/`.
- Runs pytest without downloading any real models or requiring TensorFlow/TFLite.

This keeps CI fast and robust while still enforcing basic quality standards.

---

## 9. Summary

The `models/cartoonizer` package provides a **production-style, CPU-ready, and free-first** model pipeline that:

- Downloads TFLite models from TF Hub with a reproducible convention.
- Runs local inference with clear, testable preprocessing/postprocessing.
- Converts SavedModels to multiple TFLite variants (fp32, fp16, int8) using official quantization patterns.
- Benchmarks and records size/latency trade-offs.
- Feeds into `models/MODEL_REGISTRY.md` and `context/` documents so that model choices are transparent and traceable.

It is the foundation for both:

- Cloud GPU inference (via Gradio + ZeroGPU).
- Offline mobile inference (via Flutter + `tflite_flutter`).