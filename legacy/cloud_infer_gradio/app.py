from __future__ import annotations

import logging
from typing import Dict, Tuple

import gradio as gr
from PIL import Image

from src.cartoonize_stub import cartoonize_with_tflite

logger = logging.getLogger(__name__)

# Optional ZeroGPU support: if `spaces` is not available, the decorator is a no-op.
try:
    import spaces  # type: ignore[import]
except ImportError:  # pragma: no cover

    class _DummySpaces:
        @staticmethod
        def GPU(*_args, **_kwargs):
            def decorator(fn):
                return fn

            return decorator

    spaces = _DummySpaces()  # type: ignore[assignment]


@spaces.GPU  # Effect-free unless ZeroGPU is enabled in the Space settings
def cartoonize_endpoint(
    image: Image.Image,
    model_variant: str,
) -> Tuple[Image.Image, Dict[str, float]]:
    """Gradio endpoint for cartoonization.

    Runs on CPU by default; the @spaces.GPU decorator can be enabled later
    when deploying to a ZeroGPU-backed Space.
    """
    if image is None:
        raise ValueError("No image provided")
    return cartoonize_with_tflite(image, model_variant)


def build_interface() -> gr.Blocks:
    """Build the Gradio interface for cloud cartoonization."""
    with gr.Blocks() as demo:
        gr.Markdown("# Mobile AI Cartoon Generation – Cloud Cartoonizer")
        gr.Markdown(
            "This Gradio app runs a TFLite cartoonization model on CPU by default. "
            "Optionally, it can use ZeroGPU when enabled in Hugging Face Spaces."
        )

        with gr.Row():
            input_image = gr.Image(
                label="Input image",
                type="pil",
            )
            model_variant = gr.Dropdown(
                label="Model variant",
                choices=["fp16", "int8"],
                value="fp16",
            )

        with gr.Row():
            output_image = gr.Image(
                label="Cartoonized image",
                type="pil",
            )
            latency_box = gr.JSON(label="Latency (ms)")

        def _on_cartoonize(image, variant):
            if image is None:
                return None, {}
            try:
                out_image, metrics = cartoonize_endpoint(image, variant)
            except Exception as exc:  # noqa: BLE001
                logger.exception("Gradio cartoonization failed", exc_info=exc)
                return image, {"error": str(exc)}
            return out_image, metrics

        gr.Button("Cartoonize").click(
            fn=_on_cartoonize,
            inputs=[input_image, model_variant],
            outputs=[output_image, latency_box],
        )

    return demo


# Expose the app object for Hugging Face Spaces.
demo = build_interface()

if __name__ == "__main__":
    demo.launch()
