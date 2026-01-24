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

## Example (placeholder)

```markdown
## cartoonizer_v1_example

- **Name**: Example Cartoonizer v1
- **Type**: Diffusion-based cartoonization model (example).
- **Version**: v0.0.1
- **Owners**: Core maintainers
- **Description**: Example entry describing a fictional model used for validation of the registry format.
- **Artifact locations**:
  - **HF Hub**: https://huggingface.co/example/example-cartoonizer-v1
  - **TFLite**: Built from the HF model via provided conversion scripts (not yet implemented).
  - **Other**: N/A
- **Consumers**:
  - Gradio Space: Yes (primary consumer for GPU inference).
  - FastAPI backend: No (calls Gradio instead).
  - Flutter app (TFLite): Yes (once conversion is implemented).
- **Notes**:
  - This is a placeholder example; no real model is provided at this stage.
```

When we add real models, they should be documented here first, then wired into the Gradio Space and/or TFLite pipelines as appropriate.