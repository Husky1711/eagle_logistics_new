from pydantic import BaseModel


class AdminMeta(BaseModel):
    settings_saved_at: str | None = None
    offers_saved_at: str | None = None
    couriers_saved_at: str | None = None
