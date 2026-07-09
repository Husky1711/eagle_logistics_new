"""Admin meta endpoint — last saved timestamps for dashboard."""
import pytest
from fastapi.testclient import TestClient

from app.config import settings


def test_meta_requires_auth(client: TestClient):
    response = client.get("/api/admin/meta")
    assert response.status_code == 401


def test_meta_returns_saved_at_fields(auth_client: TestClient):
    response = auth_client.get("/api/admin/meta")
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"settings_saved_at", "offers_saved_at", "couriers_saved_at"}
    for value in body.values():
        assert value is None or isinstance(value, str)


def test_meta_updates_after_settings_save(auth_client: TestClient):
    before = auth_client.get("/api/admin/meta").json()["settings_saved_at"]
    current = auth_client.get("/api/admin/settings").json()
    current["site"]["tagline"] = "QA meta timestamp check"
    auth_client.put("/api/admin/settings", json=current)
    after = auth_client.get("/api/admin/meta").json()["settings_saved_at"]
    assert after is not None
    if before is not None:
        assert after >= before
    current["site"]["tagline"] = "Delivering Excellence, Every Mile"
    auth_client.put("/api/admin/settings", json=current)
