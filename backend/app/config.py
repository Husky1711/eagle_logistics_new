from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Eagle Logistics CMS API"
    APP_VERSION: str = "0.1.0"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "change-me-in-production"
    SESSION_SECRET: str = "dev-session-secret-change-me"
    CONTENT_DIR: Path = _REPO_ROOT / "content"
    REPO_ROOT: Path = _REPO_ROOT
    CORS_ORIGINS: str = (
        "http://localhost:5174,"
        "http://localhost:5175,"
        "http://localhost:5176,"
        "http://127.0.0.1:5174,"
        "http://127.0.0.1:5175,"
        "http://127.0.0.1:5176"
    )
    SESSION_MAX_AGE: int = 60 * 60 * 24

    @field_validator("CONTENT_DIR", "REPO_ROOT", mode="after")
    @classmethod
    def resolve_paths(cls, value: Path) -> Path:
        """Relative .env paths are resolved from backend/, then made absolute."""
        path = Path(value)
        if not path.is_absolute():
            path = (_BACKEND_DIR / path).resolve()
        return path.resolve()

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
