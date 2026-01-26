from __future__ import annotations

import io
import os
from typing import Optional

from PIL import Image
import requests
import streamlit as st


def get_api_base_url() -> str:
    """Resolve the FastAPI base URL from the environment or use a sensible default."""
    return os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")


def call_backend_cartoonize(
    image: Image.Image,
    mode: str,
    model_variant: str,
) -> tuple[Optional[Image.Image], Optional[dict[str, str]], Optional[str]]:
    """Call the FastAPI /v1/cartoonize endpoint and return the result.

    Returns (image, headers, error_message).
    """
    api_base = get_api_base_url()
    url = f"{api_base}/v1/cartoonize"

    buf = io.BytesIO()
    image.save(buf, format="PNG")
    buf.seek(0)

    files = {
        "image": ("upload.png", buf.getvalue(), "image/png"),
    }
    data = {
        "mode": mode,
        "model_variant": model_variant,
        "output": "png",
    }

    try:
        response = requests.post(url, data=data, files=files, timeout=30)
    except Exception as exc:  # noqa: BLE001
        return None, None, f"Failed to reach API at {url}: {exc}"

    if response.status_code != 200:
        try:
            detail = response.json().get("detail")
        except Exception:  # noqa: BLE001
            detail = response.text
        return None, None, f"API error ({response.status_code}): {detail}"

    try:
        result_image = Image.open(io.BytesIO(response.content)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        return None, None, f"Failed to decode response image: {exc}"

    return result_image, dict(response.headers), None


def main() -> None:
    st.set_page_config(
        page_title="Mobile AI Cartoon Generation – Web UI",
        layout="centered",
    )

    st.title("Mobile AI Cartoon Generation (Web UI)")
    st.write(
        "Upload an image and click **Cartoonize**. "
        "This UI calls the FastAPI backend, which can use either local TFLite "
        "inference or a Gradio Space in the cloud."
    )

    st.sidebar.header("Backend configuration")
    api_base = get_api_base_url()
    st.sidebar.text_input("API base URL", value=api_base, key="api_base_url", disabled=True)
    st.sidebar.caption(
        "Override via the API_BASE_URL environment variable when launching Streamlit."
    )

    uploaded_file = st.file_uploader(
        "Upload an image",
        type=["png", "jpg", "jpeg"],
    )

    mode = st.radio(
        "Mode",
        options=["local", "cloud"],
        index=0,
        help="Local: CPU TFLite on the backend. Cloud: Gradio Space via gradio_client.",
    )
    model_variant = st.selectbox(
        "Model variant",
        options=["fp16", "int8"],
        index=0,
        help="Choose TFLite variant; fp16 is a good default.",
    )

    image: Optional[Image.Image] = None
    if uploaded_file is not None:
        image = Image.open(uploaded_file).convert("RGB")
        st.image(image, caption="Uploaded image", use_column_width=True)

    clicked = st.button("Cartoonize")

    if clicked:
        if image is None:
            st.warning("Please upload an image before clicking Cartoonize.")
        else:
            with st.spinner("Calling backend..."):
                result_image, headers, error = call_backend_cartoonize(
                    image=image,
                    mode=mode,
                    model_variant=model_variant,
                )

            if error is not None:
                st.error(error)
            elif result_image is not None:
                st.image(
                    result_image,
                    caption="Cartoonized image",
                    use_column_width=True,
                )

                # Latency headers
                if headers is not None:
                    total_ms = headers.get("x-latency-total-ms")
                    infer_ms = headers.get("x-latency-infer-ms")
                    st.markdown("### Latency")
                    if total_ms:
                        st.write(f"Total: `{total_ms}` ms")
                    if infer_ms:
                        st.write(f"Inference: `{infer_ms}` ms")

                # Download button
                out_buf = io.BytesIO()
                result_image.save(out_buf, format="PNG")
                st.download_button(
                    label="Download PNG",
                    data=out_buf.getvalue(),
                    file_name="cartoonized.png",
                    mime="image/png",
                )


if __name__ == "__main__":
    main()