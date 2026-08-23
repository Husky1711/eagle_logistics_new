from fastapi import APIRouter, Depends

from app.config import settings
from app.dependencies import require_admin
from app.schemas.offers_page import OffersPageDocument
from app.services.content_store import ContentStore

router = APIRouter(prefix="/admin/pages/offers", tags=["pages-offers"])

store = ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)
PAGE_FILE = "pages/offers.json"


@router.get("", response_model=OffersPageDocument)
async def get_offers_page(_: str = Depends(require_admin)) -> OffersPageDocument:
    data = store.read(PAGE_FILE)
    return OffersPageDocument.model_validate(data)


@router.put("", response_model=OffersPageDocument)
async def update_offers_page(
    payload: OffersPageDocument,
    _: str = Depends(require_admin),
) -> OffersPageDocument:
    # MVP admin UI does not edit campaign sections (e.g. university). If the
    # client omits them or sends [], keep the on-disk sections instead of wiping.
    existing = store.read(PAGE_FILE)
    data = payload.model_dump(mode="json")
    if not data.get("content", {}).get("sections"):
        existing_sections = (existing.get("content") or {}).get("sections") or []
        if existing_sections:
            data["content"]["sections"] = existing_sections
    document = OffersPageDocument.model_validate(data)
    store.write(PAGE_FILE, document.model_dump(mode="json"))
    store.sync_public_content()
    return document
