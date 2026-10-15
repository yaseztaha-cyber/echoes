#!/usr/bin/env python3
"""ECHOES Phase 3b: complete-system assets (giants, Mercury, Venus, Pluto, Sun).

Same discipline as scripts/build-globes.py: verify -> deliver, never upscale,
record everything. Native small deliveries are used as-published (no resizing
except Pluto/Sun downsamples). Sun granulation is a DOCUMENTED RECONSTRUCTION
from SDO/HMI continuum (see method below), not an observation.

Usage:
  python scripts/build-system.py --src <phase3b-src-dir>
"""
from __future__ import annotations

import argparse
import json
import os
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
Image.LOAD_TRUNCATED_IMAGES = False

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(REPO, "src", "assets", "tex")
SUND = os.path.join(REPO, "src", "assets", "sun")
HI = os.path.join(REPO, "assets-hi")

# name -> (source file, expected size or None, delivery size or None=native)
ASSETS: dict[str, tuple[str, tuple[int, int] | None, tuple[int, int] | None]] = {
    "mercury": ("mercury_mdis_1024.jpg", (1024, 512), None),
    "venus": ("ven0aaa2.jpg", (1440, 720), None),
    "venus_clouds": ("ven0mss2.jpg", (1440, 720), None),
    "jupiter": ("jup0vss1.jpg", (720, 360), None),
    "saturn": ("sat0fds1.jpg", (720, 360), None),
    "uranus": ("ura0fss1.jpg", (720, 360), None),
    "neptune": ("nep0fds1.jpg", (720, 360), None),
}


def verify_sun_flats(src: str) -> None:
    for f in ["sdo_0304.jpg", "sdo_0193.jpg", "sdo_hmiic.jpg"]:
        im = Image.open(os.path.join(src, f))
        assert im.size == (1024, 1024), f"{f}: {im.size}"
        im.convert("RGB").save(os.path.join(SUND, f), quality=90, subsampling=1)
        print(f"OK sun-flat {f}")


def build_sun_surface(src: str) -> None:
    """RECONSTRUCTED photosphere from SDO/HMI continuum full-disk (documented):
    1. find disk by brightness threshold; 2. crop central r<0.55R (low distortion);
    3. divide out the radial limb-darkening profile -> flat granulation field;
    4. warm-tint + mirror-tile to 2048x1024. Every pixel originates from the HMI
    record; geometry beyond the central crop is statistical fill, NOT data."""
    im = Image.open(os.path.join(src, "sdo_hmiic.jpg")).convert("L")
    W, H = im.size
    px = im.load()
    assert (W, H) == (1024, 1024)
    # disk centre + radius via bright-pixel bbox
    xs, ys = [], []
    for y in range(0, H, 4):
        for x in range(0, W, 4):
            if px[x, y] > 20:
                xs.append(x)
                ys.append(y)
    cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
    R = (max(xs) - min(xs) + max(ys) - min(ys)) / 4
    # radial median profile
    import statistics
    rings: dict[int, list[int]] = {}
    for y in range(H):
        for x in range(W):
            r = int(((x - cx) ** 2 + (y - cy) ** 2) ** 0.5)
            if r < R:
                rings.setdefault(r, []).append(px[x, y])
    prof = {r: statistics.median(v) for r, v in rings.items()}
    # central crop r < 0.55R, flatten
    half = int(R * 0.55)
    crop = Image.new("L", (half * 2, half * 2))
    cp = crop.load()
    for y in range(half * 2):
        for x in range(half * 2):
            r = int(((x - half) ** 2 + (y - half) ** 2) ** 0.5)
            if r >= half:
                cp[x, y] = 128
                continue
            gx, gy = int(cx - half + x), int(cy - half + y)
            base = prof.get(int(((gx - cx) ** 2 + (gy - cy) ** 2) ** 0.5), 128) or 128
            v = im.getpixel((gx, gy)) / base
            cp[x, y] = max(0, min(255, int(128 + (v - 1.0) * 128 * 2.2)))
    # warm tint
    warm = Image.merge("RGB", (crop, crop.point(lambda v: int(v * 0.94)), crop.point(lambda v: int(v * 0.80))))
    # mirror-tile to 1024x512 (at/below source info content — no fake detail)
    out = Image.new("RGB", (1024, 512))
    tile = warm.resize((512, 512))
    mirror = Image.merge("RGB", (
        tile.transpose(Image.FLIP_LEFT_RIGHT).getchannel("R"),
        tile.transpose(Image.FLIP_LEFT_RIGHT).getchannel("G"),
        tile.transpose(Image.FLIP_LEFT_RIGHT).getchannel("B"),
    ))
    out.paste(tile, (0, 0))
    out.paste(mirror, (512, 0))
    out.save(os.path.join(TEX, "sun.jpg"), quality=90, subsampling=1)
    print(f"OK sun surface (disk R={R:.0f}, crop r<{half})")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    args = ap.parse_args()
    os.makedirs(HI, exist_ok=True)
    os.makedirs(SUND, exist_ok=True)
    recs = {}
    for name, (f, expect, size) in ASSETS.items():
        im = Image.open(os.path.join(args.src, f))
        if expect and im.size != expect:
            raise SystemExit(f"FAIL {f}: {im.size} != {expect}")
        im = im.convert("RGB")
        if size:
            im = im.resize(size, Image.LANCZOS)
        im.save(os.path.join(TEX, f"{name}.jpg"), quality=90, subsampling=1)
        recs[name] = {"source_px": list(Image.open(os.path.join(args.src, f)).size), "delivered_px": list(im.size)}
        print(f"OK {name}: {recs[name]['source_px']} -> {recs[name]['delivered_px']}")
    # Pluto: big grayscale TIF -> 2048 + hi 4096
    pl = Image.open(os.path.join(args.src, "pluto_300m.tif")).convert("RGB")
    print("pluto source", pl.size)
    pl.resize((2048, 1024), Image.LANCZOS).save(os.path.join(TEX, "pluto.jpg"), quality=90, subsampling=1)
    pl.resize((4096, 2048), Image.LANCZOS).save(os.path.join(HI, "pluto_4k.jpg"), quality=90, subsampling=1)
    print("OK pluto")
    verify_sun_flats(args.src)
    build_sun_surface(args.src)
    print("MANIFEST-DATA " + json.dumps(recs))


if __name__ == "__main__":
    sys.exit(main())
