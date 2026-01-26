from __future__ import annotations

from typing import Any, Dict, Tuple

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_version_endpoint_returns_metadata() -> None:
    response = client.get("/version")
    assert response.status_code == 200
    payload = response.json()
    assert "version" in payload
    assert "api_version" in payload
    assert "git_sha" in payload


def test_models_endpoint_lists_modes_and_variants() -> None:
    response = client.get("/v1/models")
    assert response.status_code == 200
    payload = response.json()
    assert "modes" in payload
    assert "variants" in payload
    assert any(m["id"] == "local" for m in payload["modes"])
    assert any(v["id"] == "fp16" for v in payload["variants"])


def test_cartoonize_rejects_invalid_mode(monkeypatch) -> None:
    # Patch local and cloud runners so they are not invoked during validation tests
    from app.services import cartoonize_local, cartoonize_cloud

    def _fake_local(_: bytes, __: str) -> Tuple[bytes, Dict[str, float]]:
        return b"", {"total_ms": 0.0}

    def _fake_cloud(_: bytes, __: str, ___: str | None) -> Tuple[bytes, Dict[str, float]]:
        return b"", {"total_ms": 0.0}

    monkeypatch.setattr(cartoonize_local, "run_cartoonize_local", _fake_local)
    monkeypatch.setattr(cartoonize_cloud, "run_cartoonize_cloud", _fake_cloud)

    files = {"image": ("test.png", b"fake", "image/png")}
    data: Dict[str, Any] = {"mode": "unsupported", "model_variant": "fp16", "output": "png"}
    response = client.post("/v1/cartoonize", data=data, files=files)
    # FastAPI will coerce invalid literal to 422 Unprocessable Entity
    assert response.status_code == 422


def test_cartoonize_local_happy_path(monkeypatch) -> None:
    from app.services import cartoonize_local, cartoonize_cloud

    def _fake_local(_: bytes, __: str) -> Tuple[bytes, Dict[str, float]]:
        return b"pngbytes", {"total_ms": 12.3, "inference_ms": 7.8}

    def _fake_cloud(_: bytes, __: str, ___: str | None) -> Tuple[bytes, Dict[str, float]]:
        raise AssertionError("Cloud runner should not be called in this test")

    monkeypatch.setattr(cartoonize_local, "run_cartoonize_local", _fake_local)
    monkeypatch.setattr(cartoonize_cloud, "run_cartoonize_cloud", _fake_cloud)

    files = {"image": ("test.png", b"fake", "image/png")}
    data: Dict[str, Any] = {"mode": "local", "model_variant": "fp16", "output": "png"}
    response = client.post("/v1/cartoonize", data=data, files=files)
    assert response.status_code == 200
    assert response.headers.get("x-mode") == "local"
    assert response.headers.get("x-variant") == "fp16"
    assert "x-latency-total-ms" in response.headers