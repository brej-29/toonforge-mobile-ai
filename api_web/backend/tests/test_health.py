from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_ok_status() -> None:
    response = client.get("/health")
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "ok"
    assert isinstance(payload.get("service"), str)
    assert isinstance(payload.get("version"), str)
    assert isinstance(payload.get("environment"), str)
