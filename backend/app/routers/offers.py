from fastapi import APIRouter, Depends

from app.dependencies import require_admin
from app.schemas.offers import OffersDocument
from app.services.content_store import ContentStore
from app.config import settings

router = APIRouter(prefix="/admin/offers", tags=["offers"])

store = ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)


@router.get("", response_model=OffersDocument)
async def get_offers(_: str = Depends(require_admin)) -> OffersDocument:
    data = store.read("offers.json")
    return OffersDocument.model_validate(data)


@router.put("", response_model=OffersDocument)
async def update_offers(
    payload: OffersDocument,
    _: str = Depends(require_admin),
) -> OffersDocument:
    store.write("offers.json", payload.model_dump())
    store.sync_public_content()
    return payload
