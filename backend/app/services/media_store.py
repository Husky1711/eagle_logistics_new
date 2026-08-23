import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

ALLOWED_FOLDERS = frozenset({"pages", "couriers", "home"})
ALLOWED_EXTENSIONS = frozenset({".png", ".jpg", ".jpeg", ".webp"})
MAX_BYTES = 2 * 1024 * 1024

_SAFE_FILENAME = re.compile(r"[^a-zA-Z0-9._-]+")


class MediaStoreError(ValueError):
    pass


class MediaStore:
    """Write image assets under public/assets/{folder}/ with backup on replace."""

    def __init__(self, repo_root: Path):
        self.repo_root = Path(repo_root)
        self.assets_root = (self.repo_root / "public" / "assets").resolve()

    def _folder_path(self, folder: str) -> Path:
        if folder not in ALLOWED_FOLDERS:
            raise MediaStoreError(f"Folder not allowed: {folder}")
        path = (self.assets_root / folder).resolve()
        if not str(path).startswith(str(self.assets_root)):
            raise MediaStoreError("Invalid folder path")
        path.mkdir(parents=True, exist_ok=True)
        return path

    def sanitize_filename(self, name: str) -> str:
        base = Path(name).name.strip()
        if not base or base in {".", ".."}:
            raise MediaStoreError("Invalid filename")
        stem = Path(base).stem
        ext = Path(base).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise MediaStoreError(f"File type not allowed. Use: {', '.join(sorted(ALLOWED_EXTENSIONS))}")
        safe_stem = _SAFE_FILENAME.sub("-", stem).strip("-._")
        if not safe_stem:
            raise MediaStoreError("Invalid filename")
        return f"{safe_stem}{ext}"

    def _detect_extension(self, content: bytes) -> str | None:
        if content.startswith(b"\x89PNG\r\n\x1a\n"):
            return ".png"
        if content.startswith(b"\xff\xd8\xff"):
            return ".jpg"
        if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
            return ".webp"
        return None

    def _backup_existing(self, path: Path) -> None:
        if not path.exists():
            return
        backup_dir = path.parent / ".backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        backup_name = f"{path.stem}.{stamp}{path.suffix}"
        shutil.copy2(path, backup_dir / backup_name)

    def upload(
        self,
        folder: str,
        content: bytes,
        *,
        target_filename: str | None = None,
        original_filename: str | None = None,
    ) -> dict[str, str | bool]:
        if len(content) > MAX_BYTES:
            raise MediaStoreError(f"File too large (max {MAX_BYTES // (1024 * 1024)} MB)")

        detected = self._detect_extension(content)
        if not detected:
            raise MediaStoreError("File is not a valid PNG, JPEG, or WebP image")

        if target_filename:
            filename = self.sanitize_filename(target_filename)
        elif original_filename:
            filename = self.sanitize_filename(original_filename)
            if Path(filename).suffix != detected and detected == ".jpg":
                filename = f"{Path(filename).stem}.jpg"
            elif Path(filename).suffix != detected:
                filename = f"{Path(filename).stem}{detected}"
        else:
            raise MediaStoreError("Filename required")

        if Path(filename).suffix not in ALLOWED_EXTENSIONS:
            raise MediaStoreError(f"File type not allowed. Use: {', '.join(sorted(ALLOWED_EXTENSIONS))}")

        folder_path = self._folder_path(folder)
        dest = (folder_path / filename).resolve()
        if not str(dest).startswith(str(folder_path)):
            raise MediaStoreError("Invalid filename path")

        replaced = dest.exists()
        self._backup_existing(dest)

        temp_path = dest.with_suffix(f"{dest.suffix}.tmp")
        temp_path.write_bytes(content)
        temp_path.replace(dest)

        return {
            "folder": folder,
            "filename": filename,
            "assetPath": f"{folder}/{filename}",
            "url": f"/assets/{folder}/{filename}",
            "replaced": replaced,
        }

    def list_assets(self, folder: str) -> list[str]:
        folder_path = self._folder_path(folder)
        names: list[str] = []
        for path in sorted(folder_path.iterdir()):
            if path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS:
                names.append(path.name)
        return names
