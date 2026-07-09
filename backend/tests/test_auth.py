"""Senior QA — auth endpoints only (/api/auth/login, /logout, /me)."""
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_me_without_session_returns_401(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_logout_without_session_returns_401(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 401


def test_login_empty_body_returns_422(client):
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 422


def test_login_empty_strings_returns_422(client):
    response = client.post("/api/auth/login", json={"username": "", "password": ""})
    assert response.status_code == 422


def test_login_wrong_credentials_returns_401(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "wrong", "password": "wrong"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_login_wrong_username_length_must_not_500(client):
    """Regression: secrets.compare_digest raises on length mismatch."""
    response = client.post(
        "/api/auth/login",
        json={"username": "x", "password": settings.ADMIN_PASSWORD},
    )
    assert response.status_code == 401
    assert response.status_code != 500


def test_login_wrong_password_length_must_not_500(client):
    response = client.post(
        "/api/auth/login",
        json={"username": settings.ADMIN_USERNAME, "password": "short"},
    )
    assert response.status_code == 401


def test_login_success_sets_session_cookie(client):
    response = client.post(
        "/api/auth/login",
        json={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    assert response.json() == {"username": settings.ADMIN_USERNAME}
    assert "session" in response.cookies or any("session" in c.lower() for c in response.cookies)


def test_me_after_login_returns_user(client):
    client.post(
        "/api/auth/login",
        json={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD},
    )
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["username"] == settings.ADMIN_USERNAME


def test_logout_clears_session(client):
    client.post(
        "/api/auth/login",
        json={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD},
    )
    logout = client.post("/api/auth/logout")
    assert logout.status_code == 200
    me = client.get("/api/auth/me")
    assert me.status_code == 401


def test_session_not_shared_across_clients():
    """New TestClient = new browser; prior session must not leak."""
    client_a = TestClient(app)
    client_b = TestClient(app)
    client_a.post(
        "/api/auth/login",
        json={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD},
    )
    assert client_a.get("/api/auth/me").status_code == 200
    assert client_b.get("/api/auth/me").status_code == 401


def test_login_response_does_not_echo_password(client):
    response = client.post(
        "/api/auth/login",
        json={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD},
    )
    body = response.text.lower()
    assert settings.ADMIN_PASSWORD.lower() not in body


def test_relogin_without_logout_succeeds(client):
    """Regression: session.clear() on login must not break re-authentication."""
    creds = {"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD}
    assert client.post("/api/auth/login", json=creds).status_code == 200
    assert client.post("/api/auth/login", json=creds).status_code == 200
    assert client.get("/api/auth/me").status_code == 200


def test_login_case_sensitive_username(client):
    response = client.post(
        "/api/auth/login",
        json={"username": settings.ADMIN_USERNAME.upper(), "password": settings.ADMIN_PASSWORD},
    )
    if settings.ADMIN_USERNAME != settings.ADMIN_USERNAME.upper():
        assert response.status_code == 401
