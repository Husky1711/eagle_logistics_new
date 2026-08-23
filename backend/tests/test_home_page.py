"""Home page CMS (/api/admin/pages/home)."""
import copy

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.services.content_store import ContentStore


@pytest.fixture
def store():
    return ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)


@pytest.fixture
def original_home_page(store):
    data = store.read("pages/home.json")
    yield copy.deepcopy(data)
    store.write("pages/home.json", data)
    store.sync_public_content()


def test_home_page_requires_auth(client: TestClient):
    response = client.get("/api/admin/pages/home")
    assert response.status_code == 401


def test_home_page_round_trip(auth_client: TestClient, original_home_page):
    current = auth_client.get("/api/admin/pages/home")
    assert current.status_code == 200
    body = current.json()
    assert body["content"]["hero"]["headline"]
    assert body["content"]["serviceCards"]

    body["content"]["hero"]["headline"] = "QA home headline marker"
    body["content"]["intro"]["sectionTitle"] = "QA why ship title"
    updated = auth_client.put("/api/admin/pages/home", json=body)
    assert updated.status_code == 200, updated.text
    assert updated.json()["content"]["hero"]["headline"] == "QA home headline marker"

    public_path = settings.REPO_ROOT / "public" / "content" / "pages" / "home.json"
    synced = public_path.read_text(encoding="utf-8")
    assert "QA home headline marker" in synced


def test_home_page_preserves_deferred_blocks_when_omitted(
    auth_client: TestClient, original_home_page
):
    current = auth_client.get("/api/admin/pages/home").json()
    assert current["content"]["serviceCards"]
    assert current["content"]["heroImages"]
    before_cards = current["content"]["serviceCards"]
    before_slides = current["content"]["heroImages"]

    payload = {
        "meta": current["meta"],
        "content": {
            "hero": {**current["content"]["hero"], "headline": "QA preserve headline"},
            "intro": current["content"]["intro"],
            "mission": {"title": "QA mission", "items": ["One"]},
            "testimonials": current["content"]["testimonials"],
            "cta": current["content"]["cta"],
            "heroImages": [],
            "serviceCards": [],
            "advantages": {"title": "", "items": []},
            "popularItems": {"title": "", "viewAllLabel": "", "viewAllLink": "", "items": []},
            "cargo": {"title": "", "items": []},
        },
    }
    updated = auth_client.put("/api/admin/pages/home", json=payload)
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["content"]["hero"]["headline"] == "QA preserve headline"
    assert body["content"]["serviceCards"] == before_cards
    assert body["content"]["heroImages"] == before_slides


def test_home_page_service_cards_round_trip(auth_client: TestClient, original_home_page):
    current = auth_client.get("/api/admin/pages/home").json()
    current["content"]["serviceCards"][0]["title"] = "QA Domestic card title"
    current["content"]["popularItems"]["items"][0]["title"] = "QA Sweets tile"
    current["content"]["cargo"]["items"][1]["summary"] = "QA sea cargo summary"

    updated = auth_client.put("/api/admin/pages/home", json=current)
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["content"]["serviceCards"][0]["title"] == "QA Domestic card title"
    assert body["content"]["popularItems"]["items"][0]["title"] == "QA Sweets tile"
    assert body["content"]["cargo"]["items"][1]["summary"] == "QA sea cargo summary"
    assert body["content"]["popularItems"]["items"][0]["slug"] == "sweets"

    synced = (
        settings.REPO_ROOT / "public" / "content" / "pages" / "home.json"
    ).read_text(encoding="utf-8")
    assert "QA Domestic card title" in synced


def test_home_page_meta_and_utf8_round_trip(auth_client: TestClient, original_home_page):
    current = auth_client.get("/api/admin/pages/home").json()
    current["meta"]["title"] = "QA SEO title — Bangalore courier"
    current["content"]["hero"]["promo"] = "Gifts from ₹567*/kg · conditions apply"

    updated = auth_client.put("/api/admin/pages/home", json=current)
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["meta"]["title"] == "QA SEO title — Bangalore courier"
    assert "₹567" in body["content"]["hero"]["promo"]

    synced = (
        settings.REPO_ROOT / "public" / "content" / "pages" / "home.json"
    ).read_text(encoding="utf-8")
    assert "QA SEO title — Bangalore courier" in synced
    assert "₹567" in synced
