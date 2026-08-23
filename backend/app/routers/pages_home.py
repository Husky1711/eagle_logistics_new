from typing import Any

from fastapi import APIRouter, Depends

from app.config import settings
from app.dependencies import require_admin
from app.schemas.home_page import HomePageDocument
from app.services.content_store import ContentStore

router = APIRouter(prefix="/admin/pages/home", tags=["pages-home"])

store = ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)
PAGE_FILE = "pages/home.json"


def _preserve_unedited_blocks(existing: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    """Keep H2/H3 blocks when the MVP admin UI omits or clears them."""
    existing_content = existing.get("content") or {}
    content = data.get("content") or {}

    if not content.get("heroImages"):
        content["heroImages"] = existing_content.get("heroImages") or []
    if not content.get("serviceCards"):
        content["serviceCards"] = existing_content.get("serviceCards") or []

    if not (content.get("advantages") or {}).get("items"):
        existing_advantages = existing_content.get("advantages") or {}
        if existing_advantages.get("items"):
            content["advantages"] = existing_advantages

    if not (content.get("popularItems") or {}).get("items"):
        existing_popular = existing_content.get("popularItems") or {}
        if existing_popular.get("items"):
            content["popularItems"] = existing_popular

    if not (content.get("cargo") or {}).get("items"):
        existing_cargo = existing_content.get("cargo") or {}
        if existing_cargo.get("items"):
            content["cargo"] = existing_cargo

    existing_mission = existing_content.get("mission") or {}
    mission = content.get("mission") or {}
    if not mission.get("image") and existing_mission.get("image"):
        mission["image"] = existing_mission["image"]
    if not mission.get("imageAlt") and existing_mission.get("imageAlt"):
        mission["imageAlt"] = existing_mission["imageAlt"]
    content["mission"] = mission

    data["content"] = content
    return data


@router.get("", response_model=HomePageDocument)
async def get_home_page(_: str = Depends(require_admin)) -> HomePageDocument:
    data = store.read(PAGE_FILE)
    return HomePageDocument.model_validate(data)


@router.put("", response_model=HomePageDocument)
async def update_home_page(
    payload: HomePageDocument,
    _: str = Depends(require_admin),
) -> HomePageDocument:
    existing = store.read(PAGE_FILE)
    data = _preserve_unedited_blocks(existing, payload.model_dump(mode="json"))
    document = HomePageDocument.model_validate(data)
    store.write(PAGE_FILE, document.model_dump(mode="json"))
    store.sync_public_content()
    return document
