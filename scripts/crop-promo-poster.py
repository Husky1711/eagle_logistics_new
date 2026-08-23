"""Crop duplicate yellow header from special-offers-promo.png."""
from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGE = ROOT / "public" / "assets" / "pages" / "special-offers-promo.png"
BACKUP_DIR = ROOT / "public" / "assets" / "pages" / ".backups"


def is_yellow(r: int, g: int, b: int, a: int = 255) -> bool:
    return a > 200 and r > 200 and g > 180 and b < 130


def find_crop_top(im: Image.Image) -> int:
    w, h = im.size
    px = im.load()
    last_yellow = 0
    for y in range(min(h, int(h * 0.35))):
        yellow = sum(1 for x in range(w) if is_yellow(*px[x, y][:3], px[x, y][3]))
        if yellow / w > 0.35:
            last_yellow = y
    # Skip a couple px below the yellow block for a clean edge.
    return min(h - 1, last_yellow + 3)


def main() -> None:
    if not IMAGE.exists():
        raise SystemExit(f"Missing image: {IMAGE}")

    im = Image.open(IMAGE).convert("RGBA")
    top = find_crop_top(im)
    cropped = im.crop((0, top, im.width, im.height))

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = BACKUP_DIR / f"special-offers-promo.{stamp}.png"
    shutil.copy2(IMAGE, backup)

    cropped.save(IMAGE, optimize=True)
    print(f"Original: {im.size[0]}x{im.size[1]}")
    print(f"Cropped top: {top}px -> {cropped.size[0]}x{cropped.size[1]}")
    print(f"Backup: {backup}")


if __name__ == "__main__":
    main()
