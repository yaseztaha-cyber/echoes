#!/usr/bin/env python3
"""Build the equirectangular sun map from a real full-disk SDO/HMI continuum image.

Input:  recent SDO/HMI "continuum" (HMI intensitygram, 4500 A ~ Fe I) full-disk
        JPEG as served by sdo.gsfc.nasa.gov (e.g. latest_4096_4500.jpg).
Output: src/assets/tex/sun.jpg        2048x1024 JPEG q90  (bundled tier)
        assets-hi/sun_4k.jpg          4096x2048 JPEG q92  (encoded tier)

Method (documented, honest):
 1. Detect the solar disk (center + radius) from the middle row/column.
 2. For every output texel invert the equirectangular -> orthographic map and
    bilinearly sample the real observed hemisphere.
 3. The far side is unavailable from a single disk; it is filled with the
    east-west mirror of the near side at 85% brightness so plate consumers can
    see it is reconstructed. Recorded in the manifest as such.
 4. Solar north is image-up. The SDO full-res product leaves the ~ +-7.25 deg
    P-angle (pole tilt) uncorrected; documented in the manifest rather than
    de-rotating by guesswork.

Usage: python scripts/build-sun-map.py <input.jpg>
"""
import sys
from PIL import Image

IN = sys.argv[1]
im = Image.open(IN).convert("RGB")
W0, H0 = im.size
px = im.load()

# --- 1. disk detection ---------------------------------------------------
cx, cy = W0 // 2, H0 // 2

def thresh(p):  # continuum disk is bright vs black background
    return 0.30 * 255 > (p[0] + p[1] + p[2]) / 3

# scan from -center outward until brightness drops below threshold
def radius_row():
    lim = 0
    for dx in range(1, min(cx, cy)):
        p = px[cx + dx, cy]
        q = px[cx - dx, cy]
        if thresh(p) or thresh(q):
            return dx
        lim = dx
    return lim

# fine-tune with a vertical scan too
def radius_col():
    lim = 0
    for dy in range(1, min(cx, cy)):
        p = px[cx, cy + dy]
        q = px[cx, cy - dy]
        if thresh(p) or thresh(q):
            return dy
        lim = dy
    return lim

R = min(radius_row(), radius_col())
print(f"input {W0}x{H0}; disk center ({cx},{cy}) radius {R}px")

# --- 2/3. reproject ------------------------------------------------------
import math

def sample(x, y):  # bilinear, clamped
    fx = max(0, min(W0 - 1.001, x))
    fy = max(0, min(H0 - 1.001, y))
    x0, y0 = int(fx), int(fy)
    dx, dy = fx - x0, fy - y0
    out = []
    for c in range(3):
        a = px[x0, y0][c] * (1 - dx) + px[x0 + 1, y0][c] * dx
        b = px[x0, y0 + 1][c] * (1 - dx) + px[x0 + 1, y0 + 1][c] * dx
        out.append(a * (1 - dy) + b * dy)
    return out

def build(width, height):
    out = Image.new("RGB", (width, height))
    po = out.load()
    for j in range(height):
        v = (j + 0.5) / height
        lat = math.radians(90 - 180 * v)
        cl, sl = math.cos(lat), math.sin(lat)
        for i in range(width):
            u = (i + 0.5) / width
            rel = ((u - 0.75 + 0.5) % 1) - 0.5  # near side spans u in [0.5,1.0)
            lon = math.radians(360 * rel)
            xo, yo, zo0 = cl * math.sin(lon), sl, cl * math.cos(lon)
            far = zo0 < 0
            xo, zo = (xo, zo0) if not far else (-xo, -zo0)
            col = sample(cx + xo * R, cy - yo * R)
            if far:
                # east-west mirror of the observed half; brightness fades
                # smoothly back to full at the seam (depth 0 at boundary,
                # max at the far center) so no hard vertical line appears
                depth = min(1.0, -zo0 / max(cl, 1e-6))
                col = [c * (1 - 0.15 * depth) for c in col]
            po[i, j] = tuple(int(round(c)) for c in col)
    return out

std = build(2048, 1024)
std.save("src/assets/tex/sun.jpg", quality=90)
print("src/assets/tex/sun.jpg saved")

hi = build(4096, 2048)
hi.save("assets-hi/sun_4k.jpg", quality=92)
print("assets-hi/sun_4k.jpg saved")
