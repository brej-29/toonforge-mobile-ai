from __future__ import annotations

from typing import Optional

from PIL import Image
import streamlit as st


def cartoonize_local_stub(image: Image.Image) -> Image.Image:
    """
    Placeholder cartoonization function for the Streamlit UI.

    For now, this simply returns the original image unchanged.
    Later, this will either:
    - Call the FastAPI backend for cloud inference, or
    - Invoke a local lightweight transformation (for demos).
    """
    return image


def main() -> None:
    st.set_page_config(
        page_title="Mobile AI Cartoon Generation – Web UI",
        layout="centered",
    )

    st.title("Mobile AI Cartoon Generation (Web UI)")
    st.write(
        "Upload an image and click **Cartoonize**. "
        "This is a scaffold: the button currently uses a local stub and does not "
        "call the FastAPI backend yet."
    )

    uploaded_file = st.file_uploader(
        "Upload an image",
        type=["png", "jpg", "jpeg"],
    )

    image: Optional[Image.Image] = None
    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        st.image(image, caption="Uploaded image", use_column_width=True)

    clicked = st.button("Cartoonize")

    if clicked:
        if image is None:
            st.warning("Please upload an image before clicking Cartoonize.")
        else:
            with st.spinner("Cartoonizing (stub)..."):
                cartoonized = cartoonize_local_stub(image)
            st.image(
                cartoonized,
                caption="Cartoonized image (stub)",
                use_column_width=True,
            )
            st.info(
                "Backend integration is not implemented yet. "
                "In a future version, this button will call the FastAPI API."
            )


if __name__ == "__main__":
    main()