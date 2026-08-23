from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.config import settings
from app.dependencies import require_admin
from app.schemas.media import MediaListResponse, MediaUploadResponse
from app.services.media_store import MediaStore, MediaStoreError

router = APIRouter(prefix="/admin/media", tags=["media"])

store = MediaStore(settings.REPO_ROOT)


@router.post("/upload", response_model=MediaUploadResponse)
async def upload_media(
    folder: str = Form(...),
    file: UploadFile = File(...),
    target_filename: str | None = Form(None),
    _: str = Depends(require_admin),
) -> MediaUploadResponse:
    content = await file.read()
    try:
        result = store.upload(
            folder,
            content,
            target_filename=target_filename or None,
            original_filename=file.filename,
        )
    except MediaStoreError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MediaUploadResponse.model_validate(result)


@router.get("/{folder}", response_model=MediaListResponse)
async def list_media(folder: str, _: str = Depends(require_admin)) -> MediaListResponse:
    try:
        files = store.list_assets(folder)
    except MediaStoreError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MediaListResponse(folder=folder, files=files)
