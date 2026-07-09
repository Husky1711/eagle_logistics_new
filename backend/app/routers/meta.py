from fastapi import APIRouter, Depends

from app.config import settings
from app.dependencies import require_admin
from app.schemas.meta import AdminMeta
from app.services.content_store import ContentStore

router = APIRouter(prefix="/admin/meta", tags=["meta"])

store = ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)

META_FILES = {
    "settings_saved_at": "settings.json",
    "offers_saved_at": "offers.json",
    "couriers_saved_at": "couriers.json",
}


@router.get("", response_model=AdminMeta)
async def get_admin_meta(_: str = Depends(require_admin)) -> AdminMeta:
    return AdminMeta(
        **{
            field: store.last_modified_at(filename)
            for field, filename in META_FILES.items()
        }
    )
