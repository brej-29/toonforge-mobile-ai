from PIL import Image


def cartoonize_stub(image: Image.Image) -> Image.Image:
    """
    Placeholder cartoonization function.

    For now this function simply returns the input image unchanged.
    Later, this will wrap a real cartoonization model running on
    Hugging Face Spaces with ZeroGPU.
    """
    # The argument and return types are intentionally Image.Image to keep
    # the integration with Gradio simple.
    return image