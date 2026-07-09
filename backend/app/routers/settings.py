from fastapi import APIRouter, Depends

from app.dependencies import require_admin
from app.schemas.settings import SettingsDocument
from app.services.content_store import ContentStore
from app.config import settings

router = APIRouter(prefix="/admin/settings", tags=["settings"])

store = ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)


@router.get("", response_model=SettingsDocument)
async def get_settings(_: str = Depends(require_admin)) -> SettingsDocument:
    data = store.read("settings.json")
    return SettingsDocument.model_validate(data)


@router.put("", response_model=SettingsDocument)
async def update_settings(
    payload: SettingsDocument,
    _: str = Depends(require_admin),
) -> SettingsDocument:
    existing = SettingsDocument.model_validate(store.read("settings.json"))
    merged = payload.model_dump()
    # Sprint 1: preserve map embed edited only via repo / Sprint 3 admin
    merged["contact"]["googleMapsEmbed"] = existing.contact.googleMapsEmbed

    document = SettingsDocument.model_validate(merged)
    store.write("settings.json", document.model_dump())
    store.sync_public_content()
    return document
