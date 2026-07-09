from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.routers import auth, couriers, meta, offers, publish, settings as settings_router

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
    max_age=settings.SESSION_MAX_AGE,
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(offers.router, prefix="/api")
app.include_router(publish.router, prefix="/api")
app.include_router(couriers.router, prefix="/api")
app.include_router(meta.router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}
