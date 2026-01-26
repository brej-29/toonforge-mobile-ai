# Model registry

This file serves as a **logical registry** of all cartoonization models used by the project. It does not store weights; instead, it records metadata and locations.

## Registry format

Use the following template for each model entry:

```markdown
## <MODEL_ID>

- **Name**: Human-readable model name.
- **Type**: (e.g., diffusion, GAN, CNN-based, TFLite, etc.).
- **Version**: Semantic or date-based version (e.g., `v1.0.0`, `2026-01-24`).
- **Owners**: Primary maintainers.
- **Description**: Short description of what the model does and its strengths/limitations.
- **Artifact locations**:
  - **HF Hub**: Link to Hugging Face repo/tag (if applicable).
  - **TFLite**: Location or build instructions for TFLite version (if applicable).
  - **Other**: Any other external storage locations.
- **Consumers**:
  - Gradio Space: Yes/No
  - FastAPI backend: Yes/No (directly, if any future models run on CPU)
  - Flutter app (TFLite): Yes/No
- **Notes**:
  - License information and any usage constraints.
  - Additional implementation notes, trade-offs, etc.
```

## Registered models

### cartoonizer_cartoongan_fp16_tfhub

- **Name**: CartoonGAN TF Hub (float16)
- **Type**: GAN-based cartoonization, TFLite fp16
- **Version**: v0.1.0
- **Owners**: Core maintainers
- **Description**: CartoonGAN-style model downloaded from TF Hub as a float16-optimized TFLite model using the `?lite-format=tflite` convention.
- **Artifact locations**:
  - **HF Hub**: N/A (TF Hub origin)
  - **TFLite**: Download path under `models/artifacts/downloaded/cartoongan-fp16.tflite`
  - **Other**: TF Hub URL derived from registry entry (see `cartoonizer/registry.py`)
- **Consumers**:
  - Gradio Space: Future (GPU/ZeroGPU-backed cartoonization)
  - FastAPI backend: Indirect, via TFLite pipeline or cloud adapters
  - Flutter app (TFLite): Yes (offline mode via `tflite_flutter`, future integration)
- **Notes**:
  - Input shape: 1x256x256x3 (BGR, normalized to [-1, 1]).
  - Preprocessing: RGB → BGR, resize to ~256x256, normalize to [-1, 1].
  - Postprocessing: De-normalize to [0, 255] uint8, BGR → RGB.
  - Size / benchmarks: See JSON files under `models/artifacts/benchmarks/` (once generated).
  - License: Refer to the underlying TF Hub model license before commercial use.

### cartoonizer_cartoongan_int8_tfhub

- **Name**: CartoonGAN TF Hub (int8)
- **Type**: GAN-based cartoonization, TFLite int8 (quantized)
- **Version**: v0.1.0
- **Owners**: Core maintainers
- **Description**: CartoonGAN-style model downloaded from TF Hub as an int8-quantized TFLite model using the `?lite-format=tflite` convention.
- **Artifact locations**:
  - **HF Hub**: N/A (TF Hub origin)
  - **TFLite**: Download path under `models/artifacts/downloaded/cartoongan-int8.tflite`
  - **Other**: TF Hub URL derived from registry entry (see `cartoonizer/registry.py`)
- **Consumers**:
  - Gradio Space: Future
  - FastAPI backend: Indirect / adapter layer
  - Flutter app (TFLite): Yes (offline mode)
- **Notes**:
  - Input shape: 1x256x256x3 (BGR, normalized to [-1, 1]).
  - Preprocessing: Same as fp16.
  - Postprocessing: Same as fp16.
  - Size / benchmarks: See JSON files under `models/artifacts/benchmarks/` (once generated).
  - License: Ensure compatibility for commercial use; this project avoids AnimeGANv2-style restrictive licenses by default.

### cartoonizer_cartoongan_converted_fp32

- **Name**: CartoonGAN Converted (fp32 baseline)
- **Type**: GAN-based cartoonization, TFLite fp32
- **Version**: v0.1.0
- **Owners**: Core maintainers
- **Description**: Baseline TFLite model produced by converting a SavedModel via the `cartoonizer` conversion pipeline.
- **Artifact locations**:
  - **HF Hub**: Optional, if SavedModel was pulled from HF
  - **TFLite**: `models/artifacts/converted/<model_name>/model_fp32.tflite`
  - **Other**: N/A
- **Consumers**:
  - Gradio Space: Potential reference for comparison
  - FastAPI backend: Potential CPU-only fallback
  - Flutter app (TFLite): Possibly, if size/latency acceptable
- **Notes**:
  - Conversion details, tensor info, size, and checksum recorded in metadata JSON next to the TFLite file.
  - Preprocessing/postprocessing: Same as CartoonGAN profile above.

### cartoonizer_cartoongan_converted_fp16

- **Name**: CartoonGAN Converted (fp16 optimized)
- **Type**: GAN-based cartoonization, TFLite fp16
- **Version**: v0.1.0
- **Owners**: Core maintainers
- **Description**: Float16-quantized variant produced by post-training quantization.
- **Artifact locations**:
  - **TFLite**: `models/artifacts/converted/<model_name>/model_fp16.tflite`
- **Consumers**:
  - Flutter app (TFLite): Preferred offline variant when quality is acceptable.
- **Notes**:
  - Smaller than fp32 with similar quality; exact size and latency captured in benchmark JSON.

### cartoonizer_cartoongan_converted_int8

- **Name**: CartoonGAN Converted (int8)
- **Type**: GAN-based cartoonization, TFLite int8 (quantized)
- **Version**: v0.1.0
- **Owners**: Core maintainers
- **Description**: Int8-quantized variant produced by post-training quantization.
- **Artifact locations**:
  - **TFLite**: `models/artifacts/converted/<model_name>/model_int8.tflite`
- **Consumers**:
  - Flutter app (TFLite): Potentially best for low-end devices if quality remains acceptable.
- **Notes**:
  - When a representative dataset is provided, full integer quantization is used.
  - Without representative data, dynamic range quantization is applied.
  - Benchmark JSON files capture size and latency trade-offs.

When we add additional models (for example, alternative cartoon styles or diffusion-based cartoonizers), they should be documented here first, then wired into the Gradio Space and/or TFLite pipelines as appropriate.