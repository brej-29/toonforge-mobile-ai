from __future__ import annotations

import gradio as gr

from src.cartoonize_stub import cartoonize_stub


def build_interface() -> gr.Blocks:
    """
    Build the Gradio interface for cloud cartoonization.

    Currently this is a stub that returns the input image unchanged.
    Later, this interface will wrap a GPU-backed model running on
    Hugging Face Spaces with ZeroGPU.
    """
    with gr.Blocks() as demo:
        gr.Markdown("# Mobile AI Cartoon Generation – Cloud Stub")
        gr.Markdown(
            "This Gradio app is a placeholder. It accepts an image and returns "
            "the same image unchanged. In a future version, this will wrap a "
            "GPU-backed cartoonization model running on Hugging Face Spaces."
        )

        with gr.Row():
            input_image = gr.Image(
                label="Input image",
                type="pil",
            )
            output_image = gr.Image(
                label="Cartoonized image (stub)",
                type="pil",
            )

        def _on_cartoonize(image):
            if image is None:
                return None
            return cartoonize_stub(image)

        gr.Button("Cartoonize (stub)").click(
            fn=_on_cartoonize,
            inputs=[input_image],
            outputs=[output_image],
        )

    return demo


# Expose the app object for Hugging Face Spaces.
demo = build_interface()

if __name__ == "__main__":
    demo.launch()