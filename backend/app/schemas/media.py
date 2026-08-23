from pydantic import BaseModel


class MediaUploadResponse(BaseModel):
    folder: str
    filename: str
    assetPath: str
    url: str
    replaced: bool


class MediaListResponse(BaseModel):
    folder: str
    files: list[str]
