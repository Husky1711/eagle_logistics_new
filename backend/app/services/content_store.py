import json
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class ContentStore:
    """Read/write JSON content files with backup and sync."""

    def __init__(self, content_dir: Path, repo_root: Path):
        self.content_dir = Path(content_dir)
        self.repo_root = Path(repo_root)
        self.backup_dir = self.content_dir / ".backups"

    def _resolve(self, filename: str) -> Path:
        path = (self.content_dir / filename).resolve()
        if not str(path).startswith(str(self.content_dir.resolve())):
            raise ValueError("Invalid content path")
        return path

    def read(self, filename: str) -> dict[str, Any] | list[Any]:
        path = self._resolve(filename)
        if not path.exists():
            raise FileNotFoundError(f"Missing content file: {filename}")
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def write(self, filename: str, data: dict[str, Any] | list[Any]) -> None:
        path = self._resolve(filename)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        if path.exists():
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            backup_name = f"{path.stem}.{stamp}{path.suffix}"
            shutil.copy2(path, self.backup_dir / backup_name)

        temp_path = path.with_suffix(f"{path.suffix}.tmp")
        with temp_path.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, ensure_ascii=False)
            handle.write("\n")

        for attempt in range(3):
            try:
                temp_path.replace(path)
                break
            except PermissionError:
                if attempt == 2:
                    raise
                time.sleep(0.15 * (attempt + 1))

    def last_modified_at(self, filename: str) -> str | None:
        path = self._resolve(filename)
        if not path.exists():
            return None
        mtime = path.stat().st_mtime
        return datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()

    def sync_public_content(self) -> None:
        script = self.repo_root / "scripts" / "sync-content.js"
        if not script.exists():
            raise FileNotFoundError("sync-content.js not found")
        subprocess.run(
            ["node", str(script)],
            cwd=self.repo_root,
            check=True,
            capture_output=True,
            text=True,
        )
