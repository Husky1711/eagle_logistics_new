from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.dependencies import require_admin
from app.schemas.couriers import CouriersDocument
from app.services.content_store import ContentStore

router = APIRouter(prefix="/admin/couriers", tags=["couriers"])

store = ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)


def _reject_courier_id_renames(existing_ids: set[str], payload: CouriersDocument) -> None:
    payload_ids = {courier.id for courier in payload.root}
    removed = existing_ids - payload_ids
    added = payload_ids - existing_ids
    if removed and added:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Courier id cannot be changed. Add a new courier and deactivate the old one "
                f"(removed: {', '.join(sorted(removed))}; added: {', '.join(sorted(added))})."
            ),
        )


@router.get("", response_model=CouriersDocument)
async def get_couriers(_: str = Depends(require_admin)) -> CouriersDocument:
    data = store.read("couriers.json")
    return CouriersDocument.model_validate(data)


@router.put("", response_model=CouriersDocument)
async def update_couriers(
    payload: CouriersDocument,
    _: str = Depends(require_admin),
) -> CouriersDocument:
    existing = store.read("couriers.json")
    existing_ids = {courier["id"] for courier in existing}
    _reject_courier_id_renames(existing_ids, payload)

    store.write("couriers.json", payload.model_dump())
    store.sync_public_content()
    return payload
