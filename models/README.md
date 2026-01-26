# Models

This directory is reserved for **model-related documentation and metadata**. No model weights or proprietary artifacts are stored here.

## Purpose

- Define how cartoonization models are:
  - Named and versioned.
  - Stored (for example, Hugging Face Hub, external storage).
  - Consumed by:
    - The Gradio Space (cloud inference).
    - TFLite pipelines in the Flutter app (offline inference).
- Provide enough information for contributors to:
  - Recreate or download models.
  - Understand their capabilities and limitations.
  - Evaluate trade-offs (quality vs. latency vs. size).

## Contents

- `MODEL_REGISTRY.md` – The authoritative registry of available models, their locations, and their consumers.

## Principles

- **No weights in the repo**:
  - Keep the repository lightweight.
  - Avoid licensing/distribution issues.
- **Reproducibility**:
  - Each model entry should provide enough information to reproduce or retrieve the model.
- **Clarity**:
  - Clearly indicate which models are used for:
    - Cloud-only inference.
    - On-device TFLite deployment.
    - Experimental features.