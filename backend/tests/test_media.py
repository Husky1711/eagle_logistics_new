"""Media upload API (/api/admin/media)."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.services.media_store import MediaStore

QA_FILENAME = "qa-upload-test.png"
PAGES_DIR = settings.REPO_ROOT / "public" / "assets" / "pages"


@pytest.fixture
def store():
    return MediaStore(settings.REPO_ROOT)


@pytest.fixture
def tiny_png():
    source = PAGES_DIR / "special-offers-hero.png"
    assert source.exists(), "fixture image missing"
    return source.read_bytes()


@pytest.fixture
def cleanup_qa_upload():
    path = PAGES_DIR / QA_FILENAME
    existed = path.exists()
    original = path.read_bytes() if existed else None
    yield
    if existed and original is not None:
        path.write_bytes(original)
    elif path.exists():
        path.unlink()


def test_media_upload_requires_auth(client: TestClient, tiny_png):
    response = client.post(
        "/api/admin/media/upload",
        data={"folder": "pages"},
        files={"file": ("test.png", tiny_png, "image/png")},
    )
    assert response.status_code == 401


def test_media_upload_success(auth_client: TestClient, tiny_png, cleanup_qa_upload):
    response = auth_client.post(
        "/api/admin/media/upload",
        data={"folder": "pages", "target_filename": QA_FILENAME},
        files={"file": ("ignored.png", tiny_png, "image/png")},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["filename"] == QA_FILENAME
    assert body["folder"] == "pages"
    assert body["assetPath"] == f"pages/{QA_FILENAME}"
    assert body["url"] == f"/assets/pages/{QA_FILENAME}"
    assert (PAGES_DIR / QA_FILENAME).exists()


def test_media_upload_rejects_bad_type(auth_client: TestClient):
    response = auth_client.post(
        "/api/admin/media/upload",
        data={"folder": "pages", "target_filename": "bad.png"},
        files={"file": ("bad.png", b"not an image", "image/png")},
    )
    assert response.status_code == 400
    assert "not a valid" in response.json()["detail"].lower()


def test_media_upload_rejects_oversized(auth_client: TestClient, tiny_png):
    huge = tiny_png + b"\x00" * (2 * 1024 * 1024 + 1)
    response = auth_client.post(
        "/api/admin/media/upload",
        data={"folder": "pages", "target_filename": QA_FILENAME},
        files={"file": ("big.png", huge, "image/png")},
    )
    assert response.status_code == 400
    assert "too large" in response.json()["detail"].lower()


def test_media_upload_backs_up_on_replace(
    auth_client: TestClient, tiny_png, store, cleanup_qa_upload
):
    target = PAGES_DIR / QA_FILENAME
    target.write_bytes(tiny_png)

    backup_dir = PAGES_DIR / ".backups"
    before_backups = set(backup_dir.glob(f"{Path(QA_FILENAME).stem}.*.png")) if backup_dir.exists() else set()

    response = auth_client.post(
        "/api/admin/media/upload",
        data={"folder": "pages", "target_filename": QA_FILENAME},
        files={"file": ("replace.png", tiny_png, "image/png")},
    )
    assert response.status_code == 200
    assert response.json()["replaced"] is True

    after_backups = set(backup_dir.glob(f"{Path(QA_FILENAME).stem}.*.png"))
    assert len(after_backups) > len(before_backups)


def test_media_list_pages(auth_client: TestClient):
    response = auth_client.get("/api/admin/media/pages")
    assert response.status_code == 200
    body = response.json()
    assert body["folder"] == "pages"
    assert isinstance(body["files"], list)
    assert "special-offers-hero.png" in body["files"]


def test_media_upload_home_folder(auth_client: TestClient, tiny_png):
    home_dir = settings.REPO_ROOT / "public" / "assets" / "home"
    qa_name = "qa-upload-test.png"
    target = home_dir / qa_name
    existed = target.exists()
    original = target.read_bytes() if existed else None
    try:
        response = auth_client.post(
            "/api/admin/media/upload",
            data={"folder": "home", "target_filename": qa_name},
            files={"file": ("test.png", tiny_png, "image/png")},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["folder"] == "home"
        assert body["assetPath"] == f"home/{qa_name}"
        assert target.exists()
    finally:
        if existed and original is not None:
            target.write_bytes(original)
        elif target.exists():
            target.unlink()


def test_media_list_home(auth_client: TestClient):
    response = auth_client.get("/api/admin/media/home")
    assert response.status_code == 200
    assert response.json()["folder"] == "home"
    assert "slider-1.jpg" in response.json()["files"]
