import re
from typing import Self

from pydantic import BaseModel, Field, RootModel, field_validator, model_validator

_ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
_LOGO_PATTERN = re.compile(r"^[\w.-]+\.(png|jpg|jpeg|webp|svg)$", re.IGNORECASE)


class Courier(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=120)
    logo: str = Field(min_length=1, max_length=255)
    tracking_url: str = Field(min_length=1)
    description: str = ""
    active: bool = True
    display_order: int = Field(ge=1)

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not _ID_PATTERN.match(normalized):
            raise ValueError("id must be lowercase letters, numbers, hyphens, or underscores")
        return normalized

    @field_validator("logo")
    @classmethod
    def validate_logo(cls, value: str) -> str:
        filename = value.strip()
        if "/" in filename or "\\" in filename or ".." in filename:
            raise ValueError("logo must be a filename only (no paths)")
        if not _LOGO_PATTERN.match(filename):
            raise ValueError("logo must be an image filename (e.g. dtdc.png)")
        return filename

    @field_validator("tracking_url")
    @classmethod
    def validate_tracking_url(cls, value: str) -> str:
        url = value.strip()
        if not url.startswith(("http://", "https://")):
            raise ValueError("tracking_url must start with http:// or https://")
        if "{id}" not in url:
            raise ValueError("tracking_url must include {id} placeholder for tracking numbers")
        return url

    @field_validator("name", "description")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class CouriersDocument(RootModel[list[Courier]]):
    root: list[Courier] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_ids(self) -> Self:
        ids = [courier.id for courier in self.root]
        if len(ids) != len(set(ids)):
            raise ValueError("courier ids must be unique")
        return self
