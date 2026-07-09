from fastapi import APIRouter, Depends

from app.dependencies import require_admin
from app.services.content_store import ContentStore
from app.config import settings

router = APIRouter(prefix="/admin/publish", tags=["publish"])

store = ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)


@router.post("/sync")
async def sync_content(_: str = Depends(require_admin)) -> dict[str, str]:
    store.sync_public_content()
    return {"message": "Content synced to public/content/"}
