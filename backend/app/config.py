from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Eagle Logistics CMS API"
    APP_VERSION: str = "0.1.0"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "change-me-in-production"
    SESSION_SECRET: str = "dev-session-secret-change-me"
    CONTENT_DIR: Path = Path(__file__).resolve().parents[2] / "content"
    REPO_ROOT: Path = Path(__file__).resolve().parents[2]
    CORS_ORIGINS: str = (
        "http://localhost:5174,"
        "http://localhost:5175,"
        "http://localhost:5176,"
        "http://127.0.0.1:5174,"
        "http://127.0.0.1:5175,"
        "http://127.0.0.1:5176"
    )
    SESSION_MAX_AGE: int = 60 * 60 * 24

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
