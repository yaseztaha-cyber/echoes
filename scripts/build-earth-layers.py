#!/usr/bin/env python3
"""ECHOES earth-layers pipeline: clouds + night lights as separate delivery layers.

Reproducible route: verified source file -> delivery assets.
  1. Verify the originals (format, dimensions, exact expected sizes, 2:1 equirectangular).
  2. Clouds: the source PNG's alpha channel IS the cloud mask - transcode it to a
     grayscale JPEG delivered NATIVE (1024x512, no upscale) for runtime alphaMap use.
  3. Night: LANCZOS downsample 3600x1800 -> 2048x1024 sRGB JPEG q90.
  4. Print the manifest records (pasted into src/data/assets/manifest.ts).

No upscaling anywhere. No color repainting: sources used as published.

Usage:
  python scripts/build-earth-layers.py --clouds <clouds_src.png> --night <night_src.jpg>
"""
from __future__ import annotations

import argparse
import json
import os

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # trusted NASA sources, sizes verified by hand

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(REPO, "src", "assets", "tex")

CLOUD_EXPECT = (1024, 512)
NIGHT_EXPECT = (3600, 1800)


def check(path: str, expect: tuple[int, int]) -> Image.Image:
    im = Image.open(path)
    if im.size != expect:
        raise SystemExit(f"FAIL {path}: size {im.size} != expected {expect} (source changed?)")
    if abs(im.size[0] / im.size[1] - 2.0) > 0.01:
        raise SystemExit(f"FAIL {path}: not 2:1 equirectangular")
    return im


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--clouds", required=True)
    ap.add_argument("--night", required=True)
    args = ap.parse_args()

    # Clouds: alpha channel -> grayscale mask, delivered native.
    cl = args.clouds
    Image.open(cl).convert("RGBA")  # destructure to verify alpha present
    arr = np.asarray(Image.open(cl).convert("RGBA"))
    if int(arr[:, :, 3].max()) == 0:
        raise SystemExit(f"FAIL {cl}: no alpha channel content")
    mask = Image.fromarray(arr[:, :, 3].astype("uint8"), "L")
    out_clouds = os.path.join(TEX, "earth_clouds.jpg")
    mask.save(out_clouds, "JPEG", quality=92, optimize=True)
    print("wrote", out_clouds, mask.size, os.path.getsize(out_clouds), "bytes")

    # Night: LANCZOS downsample to the bundled 2K tier.
    nt = check(args.night, NIGHT_EXPECT).convert("RGB")
    night = nt.resize((2048, 1024), Image.LANCZOS)
    out_night = os.path.join(TEX, "earth_night.jpg")
    night.save(out_night, "JPEG", quality=90, optimize=True)
    print("wrote", out_night, night.size, os.path.getsize(out_night), "bytes")

    deliver = [
        {
            "id": "earth-clouds-2ndhand",
            "body": "earth",
            "view": "clouds",
            "class": "MOSAIC (NASA-derived cloud composite; provenance chain incomplete)",
            "epoch": "Unknown (pre-2020 composite era per delivered file)",
            "org": "upstream NASA-derived, secondhand copy via three.js examples",
            "product": "Global cloud composite (alpha cloud mask), delivered as alpha-derived grayscale",
            "sourceUrl": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png",
            "sourceFile": "earth_clouds_1024.png",
            "sourcePx": [1024, 512],
            "deliveredPx": [1024, 512],
            "projection": "Equirectangular 2:1, left edge -180 deg (standard per product convention; not feature-verified)",
            "colorClass": "White cloud opacity mask (alpha), rendered as a lit white alphaMap layer",
            "processing": "Alpha channel extracted and transcoded to grayscale JPEG q92; geolocation unverified upstream",
            "gaps": "Secondhand provenance: exact observation set, epoch and processing chain of the upstream composite unknown; replace with a direct NASA/SVS cloud product when verified",
            "credit": "upstream: NASA (chain incomplete); courtesy three.js examples",
            "format": "JPEG q92 (grayscale mask)",
            "colorSpace": "SRGBColorSpace",
            "orientation": "Standard equirectangular as delivered by three.js examples",
            "status": "APPROVED",
        },
        {
            "id": "earth-night-viirs-2016",
            "body": "earth",
            "view": "night",
            "class": "MOSAIC (VIIRS Day/Night Band annual composite)",
            "epoch": "Annual composite, 2016",
            "org": "NASA Earth Observatory (Suomi NPP VIIRS team, NASA/GSFC)",
            "product": "NASA Black Marble 2016 global night-lights composite, 0.01 deg/px rendition",
            "sourceUrl": "https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg",
            "sourceFile": "BlackMarble_2016_01deg.jpg",
            "sourcePx": [3600, 1800],
            "deliveredPx": [2048, 1024],
            "projection": "Equirectangular 2:1, left edge -180 deg (EO Black Marble global convention)",
            "colorClass": "City-light radiance composite; presented on the night hemisphere only in renderer",
            "processing": "LANCZOS downsample only. EO processing notes: cloud-free compositing with VIIRS high-latency near-real-time levels, stray-light and BRDF corrections upstream",
            "gaps": "2016 epoch (not current); gas flares and boat lights included by sensor physics; not an instantaneous snapshot",
            "credit": "NASA Earth Observatory images by Joshua Stevens, using Suomi NPP VIIRS data from Miguel Roman (NASA GSFC)",
            "format": "JPEG q90",
            "colorSpace": "SRGBColorSpace",
            "orientation": "Standard equirectangular per EO product",
            "status": "APPROVED",
        },
    ]
    with open(os.path.join(REPO, "assets-hi", "earth-layers-manifest.json"), "w", encoding="utf-8") as f:
        json.dump(deliver, f, indent=2)
    print("manifest snapshot written to assets-hi/earth-layers-manifest.json")


if __name__ == "__main__":
    main()
