import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import settings
from app.dependencies import require_admin
from app.schemas.auth import AuthUser, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthUser)
async def login(request: Request, payload: LoginRequest) -> AuthUser:
    valid_user = secrets.compare_digest(payload.username, settings.ADMIN_USERNAME)
    valid_pass = secrets.compare_digest(payload.password, settings.ADMIN_PASSWORD)
    if not (valid_user and valid_pass):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    request.session.clear()
    request.session["admin_username"] = payload.username
    return AuthUser(username=payload.username)


@router.post("/logout")
async def logout(request: Request, _: str = Depends(require_admin)) -> dict[str, str]:
    request.session.clear()
    return {"message": "Logged out"}


@router.get("/me", response_model=AuthUser)
async def me(request: Request) -> AuthUser:
    username = request.session.get("admin_username")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return AuthUser(username=username)
