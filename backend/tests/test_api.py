import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def login(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD},
    )
    assert response.status_code == 200


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_login_failure(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "wrong", "password": "wrong"},
    )
    assert response.status_code == 401


def test_login_success_and_me(client):
    login(client)
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["username"] == settings.ADMIN_USERNAME


def test_settings_requires_auth(client):
    response = client.get("/api/admin/settings")
    assert response.status_code == 401


def test_settings_round_trip(client):
    login(client)
    current = client.get("/api/admin/settings")
    assert current.status_code == 200
    payload = current.json()
    payload["site"]["name"] = "Eagle Logistics QA"
    updated = client.put("/api/admin/settings", json=payload)
    assert updated.status_code == 200
    assert updated.json()["site"]["name"] == "Eagle Logistics QA"
    # restore
    payload["site"]["name"] = "Eagle Logistics"
    client.put("/api/admin/settings", json=payload)


def test_offers_round_trip(client):
    login(client)
    current = client.get("/api/admin/offers")
    assert current.status_code == 200
    payload = current.json()
    original_title = payload["title"]
    payload["title"] = "QA Offer Title"
    updated = client.put("/api/admin/offers", json=payload)
    assert updated.status_code == 200
    assert updated.json()["title"] == "QA Offer Title"
    payload["title"] = original_title
    client.put("/api/admin/offers", json=payload)
