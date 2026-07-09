"""Sprint 2b — pricing rules CRUD (/api/admin/pricing-rules)."""
import copy
import json

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.services.content_store import ContentStore

VALID_RULE = {
    "id": "qa-pricing-rule",
    "courier": "dtdc",
    "weight_range": {"min": 0, "max": 10, "unit": "kg"},
    "distance_zones": [
        {
            "zone": "local",
            "max_distance": 50,
            "unit": "km",
            "base_price": 40,
            "price_per_kg": 10,
            "estimated_delivery": "1–2 days",
        }
    ],
    "active": True,
}


def _restore_pricing_rules(store, data):
    for attempt in range(3):
        try:
            store.write("pricing-rules.json", data)
            store.sync_public_content()
            return
        except PermissionError:
            if attempt == 2:
                raise
            import time

            time.sleep(0.15 * (attempt + 1))


@pytest.fixture
def store():
    return ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)


@pytest.fixture
def original_pricing_rules(store):
    data = store.read("pricing-rules.json")
    yield copy.deepcopy(data)
    _restore_pricing_rules(store, data)


def test_pricing_rules_requires_auth(client: TestClient):
    response = client.get("/api/admin/pricing-rules")
    assert response.status_code == 401


def test_get_pricing_rules_returns_list(auth_client: TestClient, original_pricing_rules):
    response = auth_client.get("/api/admin/pricing-rules")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    first = body[0]
    assert {"id", "courier", "weight_range", "distance_zones", "active"} <= set(first.keys())


def test_pricing_rules_round_trip(auth_client: TestClient, original_pricing_rules):
    current = auth_client.get("/api/admin/pricing-rules").json()
    current.append(VALID_RULE)
    updated = auth_client.put("/api/admin/pricing-rules", json=current)
    assert updated.status_code == 200
    assert any(item["id"] == "qa-pricing-rule" for item in updated.json())


def test_pricing_rules_syncs_public_content(auth_client: TestClient, original_pricing_rules):
    current = auth_client.get("/api/admin/pricing-rules").json()
    current.append({**VALID_RULE, "id": "sync-marker"})
    auth_client.put("/api/admin/pricing-rules", json=current)

    public_path = settings.REPO_ROOT / "public" / "content" / "pricing-rules.json"
    synced = json.loads(public_path.read_text(encoding="utf-8"))
    assert any(item["id"] == "sync-marker" for item in synced)


def test_unknown_courier_rejected(auth_client: TestClient, original_pricing_rules):
    current = auth_client.get("/api/admin/pricing-rules").json()
    current.append({**VALID_RULE, "id": "bad-courier-ref", "courier": "not-a-real-courier"})
    response = auth_client.put("/api/admin/pricing-rules", json=current)
    assert response.status_code == 400
    assert "unknown courier" in response.json()["detail"].lower()


def test_duplicate_ids_rejected(auth_client: TestClient, original_pricing_rules):
    duplicate = {**VALID_RULE, "id": "dup-test-rule"}
    response = auth_client.put("/api/admin/pricing-rules", json=[duplicate, {**duplicate}])
    assert response.status_code == 422


def test_invalid_weight_range_rejected(auth_client: TestClient, original_pricing_rules):
    current = auth_client.get("/api/admin/pricing-rules").json()
    bad = copy.deepcopy(VALID_RULE)
    bad["weight_range"] = {"min": 10, "max": 5, "unit": "kg"}
    current.append(bad)
    response = auth_client.put("/api/admin/pricing-rules", json=current)
    assert response.status_code == 422


def test_empty_zones_rejected(auth_client: TestClient, original_pricing_rules):
    current = auth_client.get("/api/admin/pricing-rules").json()
    bad = {**VALID_RULE, "id": "no-zones", "distance_zones": []}
    current.append(bad)
    response = auth_client.put("/api/admin/pricing-rules", json=current)
    assert response.status_code == 422


def test_rule_id_rename_rejected(auth_client: TestClient, original_pricing_rules):
    current = auth_client.get("/api/admin/pricing-rules").json()
    renamed = []
    for rule in current:
        if rule["id"] == "dtdc-standard":
            renamed.append({**rule, "id": "dtdc-renamed"})
        else:
            renamed.append(rule)
    response = auth_client.put("/api/admin/pricing-rules", json=renamed)
    assert response.status_code == 409
