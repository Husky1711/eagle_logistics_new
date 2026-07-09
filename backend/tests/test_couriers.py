"""Sprint 2a — couriers CRUD (/api/admin/couriers)."""
import copy
import json

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.services.content_store import ContentStore

VALID_COURIER = {
    "id": "qa-courier",
    "name": "QA Courier",
    "logo": "qa.png",
    "tracking_url": "https://example.com/track/{id}",
    "description": "Test courier for QA",
    "active": True,
    "display_order": 99,
}


@pytest.fixture
def store():
    return ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)


def _restore_couriers(store, data):
    for attempt in range(3):
        try:
            store.write("couriers.json", data)
            store.sync_public_content()
            return
        except PermissionError:
            if attempt == 2:
                raise
            import time

            time.sleep(0.15 * (attempt + 1))


@pytest.fixture
def original_couriers(store):
    data = store.read("couriers.json")
    yield copy.deepcopy(data)
    _restore_couriers(store, data)


def test_couriers_requires_auth(client: TestClient):
    response = client.get("/api/admin/couriers")
    assert response.status_code == 401


def test_get_couriers_returns_list(auth_client: TestClient, original_couriers):
    response = auth_client.get("/api/admin/couriers")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    first = body[0]
    assert {"id", "name", "logo", "tracking_url", "active", "display_order"} <= set(first.keys())


def test_couriers_round_trip(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers")
    assert current.status_code == 200
    payload = current.json()
    payload.append(VALID_COURIER)

    updated = auth_client.put("/api/admin/couriers", json=payload)
    assert updated.status_code == 200
    saved = updated.json()
    assert any(item["id"] == "qa-courier" for item in saved)

    reread = auth_client.get("/api/admin/couriers")
    assert reread.status_code == 200
    assert any(item["name"] == "QA Courier" for item in reread.json())


def test_couriers_persists_to_content_file(auth_client: TestClient, store, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    current.append(VALID_COURIER)
    auth_client.put("/api/admin/couriers", json=current)

    on_disk = store.read("couriers.json")
    assert any(item["id"] == "qa-courier" for item in on_disk)


def test_couriers_syncs_public_content(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    marker = {**VALID_COURIER, "id": "sync-marker", "name": "Sync Marker"}
    current.append(marker)
    auth_client.put("/api/admin/couriers", json=current)

    public_path = settings.REPO_ROOT / "public" / "content" / "couriers.json"
    public_data = json.loads(public_path.read_text(encoding="utf-8"))
    assert any(item["id"] == "sync-marker" for item in public_data)


def test_duplicate_ids_rejected(auth_client: TestClient, original_couriers):
    duplicate = [
        {**VALID_COURIER, "id": "dup-test", "display_order": 1},
        {**VALID_COURIER, "id": "dup-test", "name": "Duplicate", "display_order": 2},
    ]
    response = auth_client.put("/api/admin/couriers", json=duplicate)
    assert response.status_code == 422


def test_empty_list_rejected(auth_client: TestClient, original_couriers):
    response = auth_client.put("/api/admin/couriers", json=[])
    assert response.status_code == 422


def test_invalid_id_rejected(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    current.append({**VALID_COURIER, "id": "Bad ID!"})
    response = auth_client.put("/api/admin/couriers", json=current)
    assert response.status_code == 422


def test_invalid_logo_path_rejected(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    current.append({**VALID_COURIER, "logo": "../secrets.png"})
    response = auth_client.put("/api/admin/couriers", json=current)
    assert response.status_code == 422


def test_invalid_logo_extension_rejected(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    current.append({**VALID_COURIER, "logo": "malware.exe"})
    response = auth_client.put("/api/admin/couriers", json=current)
    assert response.status_code == 422


def test_tracking_url_requires_https(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    current.append({**VALID_COURIER, "tracking_url": "ftp://bad.example/{id}"})
    response = auth_client.put("/api/admin/couriers", json=current)
    assert response.status_code == 422


def test_tracking_url_requires_id_placeholder(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    current.append({**VALID_COURIER, "tracking_url": "https://example.com/track"})
    response = auth_client.put("/api/admin/couriers", json=current)
    assert response.status_code == 422


def test_display_order_must_be_positive(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    current.append({**VALID_COURIER, "display_order": 0})
    response = auth_client.put("/api/admin/couriers", json=current)
    assert response.status_code == 422


def test_missing_required_field_rejected(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    broken = {**VALID_COURIER}
    del broken["name"]
    current.append(broken)
    response = auth_client.put("/api/admin/couriers", json=current)
    assert response.status_code == 422


def test_id_normalized_to_lowercase(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    current.append({**VALID_COURIER, "id": "UPPER-QA"})
    response = auth_client.put("/api/admin/couriers", json=current)
    assert response.status_code == 200
    assert any(item["id"] == "upper-qa" for item in response.json())


def test_update_existing_courier(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    target = current[0]
    original_name = target["name"]
    target["name"] = "Updated Courier Name"

    response = auth_client.put("/api/admin/couriers", json=current)
    assert response.status_code == 200
    assert response.json()[0]["name"] == "Updated Courier Name"

    target["name"] = original_name
    auth_client.put("/api/admin/couriers", json=current)


def test_delete_courier_via_put(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    current.append(VALID_COURIER)
    auth_client.put("/api/admin/couriers", json=current)

    without_qa = [item for item in current if item["id"] != "qa-courier"]
    response = auth_client.put("/api/admin/couriers", json=without_qa)
    assert response.status_code == 200
    assert all(item["id"] != "qa-courier" for item in response.json())


def test_courier_id_rename_rejected(auth_client: TestClient, original_couriers):
    current = auth_client.get("/api/admin/couriers").json()
    renamed = []
    for courier in current:
        if courier["id"] == "dtdc":
            renamed.append({**courier, "id": "dtdc-renamed"})
        else:
            renamed.append(courier)

    response = auth_client.put("/api/admin/couriers", json=renamed)
    assert response.status_code == 409
    assert "cannot be changed" in response.json()["detail"].lower()
