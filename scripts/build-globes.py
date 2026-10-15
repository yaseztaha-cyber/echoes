#!/usr/bin/env python3
"""ECHOES Phase 3 globe-texture pipeline.

Reproducible route: verified source file -> delivery assets.
  1. Verify the original (format, dimensions, mode, 2:1 equirectangular).
  2. Emit bundled delivery 2048x1024 sRGB JPEGs into src/assets/tex/.
  3. Emit hi-res 4096x2048 variants into assets-hi/ (git-ignored, for streaming).
  4. Print the manifest records (pasted into src/data/assets/manifest.ts).

No upscaling: delivery is always <= source resolution.
No color repainting: sources are used as published (see per-asset notes).

Usage:
  python scripts/build-globes.py --src <dir-with-3-sources> [--hi-only|--std-only]
"""
from __future__ import annotations

import argparse
import json
import os
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # trusted NASA/USGS sources, sizes verified by hand
Image.LOAD_TRUNCATED_IMAGES = False

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(REPO, "src", "assets", "tex")
HI = os.path.join(REPO, "assets-hi")

ASSETS = {
    "earth": {
        "file": "earth_bmng_5400.jpg",
        "expect": (5400, 2700),
        "note": "NASA Blue Marble Next Generation, Topography+Bathymetry, December 2004 base. Natural-color composite with shaded relief; seasonal (December) composite, not an instantaneous snapshot.",
    },
    "moon": {
        "file": "moon_lroc_4k.tif",
        "expect": (4096, 2048),
        "note": "NASA SVS CGI Moon Kit 2025 color map (Dec 2025 reprocessing of Hapke-normalized LROC WAC mosaic, 643/566/415 nm, white-balanced). High-latitude dropouts inpainted; beyond +/-70 deg filled with LDAM laser albedo. SVS: optimized for aesthetics, not science.",
    },
    "mars": {
        "file": "mars_mdim21_1km.jpg",
        "expect": (21339, 10670),
        "note": "USGS Viking MDIM 2.1 color mosaic (1 km/px rendition). Orientation verified in-ECHOES via Syrtis Major (72.5E) and Hellas (71.2E). Replaces a 180-degree-shifted legacy texture.",
    },
}

STD = (2048, 1024)
HIRES = (4096, 2048)


def load(path: str, expect: tuple[int, int]) -> Image.Image:
    im = Image.open(path)
    if im.size != expect:
        raise SystemExit(f"FAIL {path}: size {im.size} != expected {expect} (source changed?)")
    if abs(im.size[0] / im.size[1] - 2.0) > 0.01:
        raise SystemExit(f"FAIL {path}: not 2:1 equirectangular")
    im = im.convert("RGB")
    # decode large JPEGs at reduced scale first to bound memory
    im.draft("RGB", (HIRES[0] * 2, HIRES[1] * 2))
    im.load()
    return im


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--std-only", action="store_true")
    ap.add_argument("--hi-only", action="store_true")
    args = ap.parse_args()
    os.makedirs(HI, exist_ok=True)
    records = {}
    for name, cfg in ASSETS.items():
        im = load(os.path.join(args.src, cfg["file"]), cfg["expect"])
        if not args.hi_only:
            std = im.resize(STD, Image.LANCZOS)
            std.save(os.path.join(TEX, f"{name}.jpg"), quality=90, subsampling=1)
        if not args.std_only:
            hi = im.resize(HIRES, Image.LANCZOS)
            hi.save(os.path.join(HI, f"{name}_4k.jpg"), quality=90, subsampling=1)
        records[name] = {
            "source_file": cfg["file"],
            "source_px": list(cfg["expect"]),
            "std_px": list(STD),
            "hi_px": list(HIRES),
            "note": cfg["note"],
        }
        print(f"OK {name}: {cfg['expect']} -> std {STD} + hi {HIRES}")
    print("MANIFEST-DATA " + json.dumps(records))


if __name__ == "__main__":
    sys.exit(main())
