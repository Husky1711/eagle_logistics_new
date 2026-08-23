"""Special Offers page CMS (/api/admin/pages/offers)."""
import copy

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.services.content_store import ContentStore


@pytest.fixture
def store():
    return ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)


@pytest.fixture
def original_offers_page(store):
    data = store.read("pages/offers.json")
    yield copy.deepcopy(data)
    store.write("pages/offers.json", data)
    store.sync_public_content()


def test_offers_page_requires_auth(client: TestClient):
    response = client.get("/api/admin/pages/offers")
    assert response.status_code == 401


def test_offers_page_round_trip(auth_client: TestClient, original_offers_page):
    current = auth_client.get("/api/admin/pages/offers")
    assert current.status_code == 200
    body = current.json()
    assert body["content"]["title"]
    assert "promoCard" in body["content"]

    body["content"]["headline"] = "QA headline marker"
    body["content"]["promoCard"]["line2"] = "@ QA/-* per kg"
    updated = auth_client.put("/api/admin/pages/offers", json=body)
    assert updated.status_code == 200, updated.text
    assert updated.json()["content"]["headline"] == "QA headline marker"

    public_path = settings.REPO_ROOT / "public" / "content" / "pages" / "offers.json"
    synced = public_path.read_text(encoding="utf-8")
    assert "QA headline marker" in synced


def test_offers_page_preserves_sections_when_omitted(
    auth_client: TestClient, original_offers_page
):
    current = auth_client.get("/api/admin/pages/offers").json()
    assert current["content"]["sections"], "fixture must include university section"
    before = current["content"]["sections"]

    payload = {
        "meta": current["meta"],
        "content": {
            **{k: v for k, v in current["content"].items() if k != "sections"},
            "headline": "QA omit-sections headline",
            "sections": [],
        },
    }
    updated = auth_client.put("/api/admin/pages/offers", json=payload)
    assert updated.status_code == 200, updated.text
    assert updated.json()["content"]["sections"] == before
    assert updated.json()["content"]["headline"] == "QA omit-sections headline"


def test_offers_page_meta_and_university_round_trip(
    auth_client: TestClient, original_offers_page
):
    current = auth_client.get("/api/admin/pages/offers").json()
    current["meta"]["title"] = "QA SEO title for offers"
    current["meta"]["description"] = "QA meta description"
    current["content"]["sections"] = [
        {
            **current["content"]["sections"][0],
            "title": "QA University title",
            "subtitle": "QA student rates",
        }
    ]
    current["content"]["promoCard"]["line2"] = "₹567 per kg*"

    updated = auth_client.put("/api/admin/pages/offers", json=current)
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["meta"]["title"] == "QA SEO title for offers"
    assert body["content"]["sections"][0]["title"] == "QA University title"
    assert body["content"]["promoCard"]["line2"] == "₹567 per kg*"

    synced = (
        settings.REPO_ROOT / "public" / "content" / "pages" / "offers.json"
    ).read_text(encoding="utf-8")
    assert "QA SEO title for offers" in synced
    assert "₹567 per kg*" in synced
