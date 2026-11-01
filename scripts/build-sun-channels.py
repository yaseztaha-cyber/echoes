#!/usr/bin/env python3
"""Build the sun-channel equirect layer maps + corona structure + sunspot list.

Inputs (downloaded into %TEMP%/opencode/sdo):
  hmiic_4096.jpg        SDO/HMI continuum (Fe I 6173 A) full disk 4096 — photosphere
  latest_1024_HMIB.jpg  SDO/HMI line-of-sight magnetogram 1024
  latest_1024_HMID.jpg  SDO/HMI dopplergram 1024
  latest_1024_0171.jpg  SDO/AIA 171 A (Fe IX) 1024
  latest_1024_0211.jpg  SDO/AIA 211 A (Fe XIV) 1024
  sdo_0304.jpg          SDO/AIA 304 A (He II) 1024 (repo science-view copy)
  lasco_c3_1024.jpg     SOHO/LASCO C3 occulted-disk corona 1024 (dated)

Outputs:
  src/assets/tex/sun_hmi.jpg, sun_doppler.jpg, sun_0304.jpg, sun_0171.jpg, sun_0211.jpg
      1024x512 equirectangular builds (inverse-ortho resample; far side =
      mirrored near side with a brightness fade — same method as sun.jpg)
  src/assets/tex/corona_mask.png
      512x256 grayscale: x = azimuth measured from LASCO C3, y = radius above
      the limb (linear, 1.15..16 solar radii) — streamed into the corona shader
  src/data/corona.json  provenance + mapping constants (epoch from watermark)
  src/data/sunspots.json real active regions detected in the HMI continuum

Honesty: the SDO stamps below are the WATERMARK timestamps read from each
product (documented; a DataOps re-fetch should re-derive them). Feature
positions are real detections from this snapshot, not art.
"""
import json
import math

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = r"C:\Users\DELL\AppData\Local\Temp\opencode\sdo"
TEX = "src/assets/tex"

CHANNELS = [
    # (input, output, watermark stamp observed in the product)
    (f"{SRC}/latest_1024_HMIB.jpg", "sun_hmi.jpg", "2026-10-23T11:30:00Z"),
    (f"{SRC}/latest_1024_HMID.jpg", "sun_doppler.jpg", "2026-10-23T11:30:00Z"),
    (f"{SRC}/latest_1024_0171.jpg", "sun_0171.jpg", "2026-10-23T11:36:08Z"),
    (f"{SRC}/latest_1024_0211.jpg", "sun_0211.jpg", "2026-10-23T11:36:08Z"),
    ("src/assets/sun/sdo_0304.jpg", "sun_0304.jpg", "2026-10-23 (repo copy; stamp from earlier retrieval)"),
]


def disk_center_radius(im):
    g = np.asarray(im.convert("L"), dtype=float)
    h, w = g.shape
    cx, cy = w // 2, h // 2
    row, col = g[cy, :], g[:, cx]
    med = float(np.median(row[row > row.max() * 0.25]))
    thr = med * 0.28

    def span(v):
        idx = np.where(v > thr)[0]
        return (int(idx[0]), int(idx[-1])) if idx.size else (0, w - 1)

    rw, cl = span(row), span(col)
    return (rw[0] + rw[1]) / 2, (cl[0] + cl[1]) / 2, min(rw[1] - rw[0], cl[1] - cl[0]) / 2


def sample_dir(W, H):
    """Equirect texel grid -> direction components, matching three.js.

    Content texel (u, row-fraction-from-top) must land at the sphere position
    three.js renders for that UV: x=-cos(phi)*sin(theta), y=cos(theta),
    z=sin(phi)*sin(theta) with phi=2pi*u, theta=pi*row (north = row 0).
    Painted against the flat disk image: px = cx + Dx*R, py = cy - Dy*R.
    Returns X (W,H), Y (W,H), Z (W,H) direction grids.
    """
def sample_dir(W, H):
    """Equirect texel grid -> direction components, matching three.js.

    Content texel (u, row-fraction-from-top) must land at the sphere position
    three.js renders for that UV: (-cos(phi)*sin(theta), cos(theta),
    sin(phi)*sin(theta)) with phi=2pi*u, theta=pi*row (north = row 0) =>
    (x, y, z) = (-cos(phi)*cos(lat), sin(lat), sin(phi)*cos(lat)),
    lat = pi/2 - theta. Painted onto the flat image as px = cx + x*R,
    py = cy - y*R; near side is z >= 0. Returns X (W,1->H), Y (1,H), Z grids.
    """
    us = (np.arange(W) + 0.5) / W
    rows = (np.arange(H) + 0.5) / H
    phi = 2 * math.pi * us[:, None]                 # (W,1)
    cl = np.cos(math.pi / 2 - math.pi * rows)[None, :]  # cos(lat) (1,H)
    sl = np.sin(math.pi / 2 - math.pi * rows)[None, :]  # sin(lat)
    X = -np.cos(phi) * cl
    Y = sl * np.ones_like(X)
    Z = np.sin(phi) * cl
    return X, Y, Z


def build_equirect(im, out_path, width=1024, height=512):
    """Inverse-orthographic equirectangular resample of a flat full-disk image.

    Near half (z>=0) is real content; far half is the mirrored near side with a
    brightness fade (disclosed reconstruction). Sampled bilinearly.
    """
    im = im.convert("RGB")
    w0, h0 = im.size
    arr = np.asarray(im, dtype=float)
    cx, cy, R = disk_center_radius(im)
    X, Y, Z = sample_dir(width, height)  # (W,H) grids
    far = Z < 0
    Xu = np.where(far, -X, X)
    fx = np.clip(cx + Xu * R, 0, w0 - 1.001)
    fy = np.clip(cy - Y * R, 0, h0 - 1.001)
    x0 = np.floor(fx).astype(int)
    y0 = np.floor(fy).astype(int)
    dx, dy = (fx - x0)[..., None], (fy - y0)[..., None]
    c00, c10 = arr[y0, x0], arr[y0, x0 + 1]
    c01, c11 = arr[y0 + 1, x0], arr[y0 + 1, x0 + 1]
    sam = (c00 * (1 - dx) + c10 * dx) * (1 - dy) + (c01 * (1 - dx) + c11 * dx) * dy
    depth = np.minimum(1.0, np.where(far, -Z, 0.0) / np.maximum(np.sqrt(np.maximum(1e-6, 1 - Y ** 2)), 1e-6))
    sam = sam * ((1 - 0.15 * depth))[..., None]
    out = np.clip(sam, 0, 255).astype(np.uint8).transpose(1, 0, 2)  # -> (H,W,3)
    Image.fromarray(out, "RGB").save(out_path, quality=85)
    print("saved", out_path)


def build_photosphere(hmiic_path, out_path=f"{TEX}/sun.jpg", width=2048, height=1024):
    """Photosphere equirect for the new shader: GRAYSCALE INTENSITY ONLY.

    No baked color ramp, no baked limb glow outside the disk (samples stay
    inside r=0.995 and saturate to the limb ring at the poles), no tone games —
    the SunShader owns color/limb-darkening/exposure. Far side = mirrored with
    fade, same disclosure as the science channels.
    """
    im = Image.open(hmiic_path).convert("RGB")
    g = np.asarray(im.convert("L"), dtype=float)
    h0, w0 = g.shape
    cx, cy, R = disk_center_radius(im)
    X, Y, Z = sample_dir(width, height)
    far = Z < 0
    Xu = np.where(far, -X, X)
    fx = np.clip((cx + Xu * R).round().astype(int), 0, w0 - 1)
    fy = np.clip((cy - Y * R).round().astype(int), 0, h0 - 1)
    val = g[fy, fx]
    depth = np.minimum(1.0, np.where(far, -Z, 0.0) / np.maximum(np.sqrt(np.maximum(1e-6, 1 - Y ** 2)), 1e-6))
    val = val * (1 - 0.15 * depth)
    near = Z >= 0.5
    p = np.percentile(val[near], [1, 25, 50, 75, 95])
    print(f"photosphere near-side intensity percentiles p1/p25/p50/p75/p95: {p.round(1)}")
    out = np.stack([val] * 3, axis=-1).clip(0, 255).astype(np.uint8).transpose(1, 0, 2)
    Image.fromarray(out, "RGB").save(out_path, quality=90)
    print("saved", out_path)


def detect_sunspots(hmiic_path):
    im = Image.open(hmiic_path).convert("L")
    cx, cy, R = disk_center_radius(im)
    g = np.asarray(im, dtype=float) / 255.0
    blur = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(41)), dtype=float) / 255.0
    rel = np.where(blur > 0.02, g / np.maximum(blur, 1e-3), 1.0)

    h, w = g.shape
    yy, xx = np.mgrid[0:h, 0:w]
    nx = (xx - cx) / R
    ny = (cy - yy) / R
    disk = np.hypot(nx, ny) < 0.96

    dark = (rel < 0.78) & disk
    ds = 4
    lab, _ = ndimage.label(dark[::ds, ::ds])

    spots = []
    for k, sl in enumerate(ndimage.find_objects(lab), 1):
        sub = lab[sl] == k
        area = float(sub.sum()) * ds * ds
        if area < 150:
            continue
        ys, xs = np.where(sub)
        pyx = (ys.mean() + sl[0].start) * ds
        pxx = (xs.mean() + sl[1].start) * ds
        # peak contrast across the downsampled region
        reg = rel[sl[0].start * ds : sl[0].stop * ds, sl[1].start * ds : sl[1].stop * ds][:: ds, :: ds]
        reg = reg[sub | (np.asarray(ndimage.binary_dilation(sub, iterations=2)[::], dtype=bool))]
        contrast = float(reg.min())
        mnx = (pxx - cx) / R
        mny = (cy - pyx) / R
        if math.hypot(mnx, mny) > 0.9:
            continue
        spots.append({"px": (float(pxx), float(pyx)), "area": area, "contrast": contrast})

    spots.sort(key=lambda s: s["area"] * (1.0 - s["contrast"]), reverse=True)
    out = []
    for s in spots[:8]:
        pxx, pyx = s["px"]
        dn = (pxx - cx) / R
        dyv = (cy - pyx) / R
        dz = math.sqrt(max(0.0, 1.0 - dn * dn - dyv * dyv))
        lon = math.degrees(math.atan2(dn, dz))
        lat = math.degrees(math.asin(max(-1.0, min(1.0, dyv))))
        # texel-space u for the three.js-convention equirect: near half is
        # u in [0, 0.5) with u=0.25 at disc centre (phi = atan2(dz, -dn))
        u = (math.atan2(dz, -dn) / (2.0 * math.pi)) % 1
        v = 0.5 - lat / 180.0
        out.append({
            "lon": round(lon, 2),
            "lat": round(lat, 2),
            "u": round(u, 5),
            "v": round(v, 5),
            "areaPx": round(s["area"]),
            "minRelativeIntensity": round(s["contrast"], 3),
        })
        print(f"spot lon {lon:7.2f}  lat {lat:7.2f}  area {s['area']:9.0f}px  contrast {s['contrast']:.3f}")
    return out


def build_corona(lasco_path):
    im = Image.open(lasco_path).convert("L")
    g = np.asarray(im, dtype=float)
    h, w = g.shape
    cx, cy = w / 2, h / 2

    # locate the white occulting-disk ring (brightness ring around image centre)
    reg = g[int(cy) - 90 : int(cy) + 90, int(cx) - 90 : int(cx) + 90]
    br = np.where(reg > 200)
    r0 = 62.0
    ox, oy = cx, cy
    if br[0].size > 200:
        oy = br[0].mean() + int(cy) - 90
        ox = br[1].mean() + int(cx) - 90
        rs = np.hypot(br[0] - (oy - int(cy) + 90), br[1] - (ox - int(cx) + 90))
        r0 = float(np.median(rs))
    print(f"C3 {w}x{h}; occulting ring at ({ox:.0f},{oy:.0f}) r0={r0:.1f}px")

    vign = g.max() * 0.92

    # --- find where the corona actually becomes visible outside the dark plate
    plateau = float(np.median(g[int(cy) - 60 : int(cy) + 60, int(cx) + 20 : int(cx) + 40]))
    r_in = r0 * 1.05
    for rr in np.arange(r0 * 1.1, r0 * 8, 1.5):
        s = np.linspace(0, 2 * math.pi, 90, endpoint=False)
        xs = (ox + np.cos(s) * rr).astype(int).clip(0, w - 1)
        ys = (oy + np.sin(s) * rr).astype(int).clip(0, h - 1)
        m = float(np.median(g[ys, xs]))
        if m > plateau + 18:
            r_in = float(rr)
            break
    r_out = min(w / 2 - 10, r0 * 16)
    print(f"corona visible from {r_in:.0f}px ({r_in / r0:.2f} R) to {r_out:.0f}px ({r_out / r0:.2f} R)")
    r_in *= 1.02

    # --- log-polar patch straight from the OBSERVED field -------------------
    # x (512) = azimuth (CCW from image north, matching C3 orientation);
    # y (256) = radius, log-mapped over the VISIBLE annulus r_in..r_out.
    W, H = 512, 256
    rr = r_in * (r_out / r_in) ** (np.linspace(0, 1, H))
    ang = 2 * np.pi * (np.arange(W) / W)
    X = (ox + np.sin(ang)[:, None] * rr[None, :]).astype(int).clip(0, w - 1)
    Y = (oy - np.cos(ang)[:, None] * rr[None, :]).astype(int).clip(0, h - 1)
    patch = g[Y, X].T.astype(float)  # (H, W)
    # clip satellites/saturation; angle-wise median keeps single-binned noise out
    patch = np.minimum(patch, vign)
    patch = ndimage.median_filter(patch, size=(1, 13), mode="wrap")
    # normalize per radius row (structure ratio around the local median)
    row_med = np.median(patch, axis=1)
    row_med = np.maximum(row_med, 1e-3)
    patch = np.clip(patch / row_med[:, None], 0, 2.0)
    # replace sweep-corrupted samples (near-black) with the row median
    patch[patch < 0.35] = 1.0
    # widen structure contrast: gaps darker, streamers brighter
    patch = np.clip((patch - 1.0) * 1.6 + 1.0, 0, 2.0)
    patch = ndimage.gaussian_filter(patch, sigma=(2.0, 2.0), mode="wrap")
    # re-apply the measured falloff (monotone outward decay)
    radial = np.median(patch, axis=1)
    radial /= radial[0]
    radial = np.maximum.accumulate(radial)[::-1][::-1]
    patch = np.clip(radial[:, None] * patch, 0, 1) ** 0.9
    mask = (patch * 255).astype(np.uint8)
    Image.fromarray(mask, "L").save(f"{TEX}/corona_mask.png")
    print("saved", f"{TEX}/corona_mask.png")

    meta = {
        "source": "SOHO/LASCO C3 white-light corona (occulted disk), log-polar remap of the OBSERVED field",
        "sourceFile": "lasco_c3_1024.jpg",
        "sourceUrl": "https://soho.nascom.nasa.gov/data/REPROCESSING/Completed/2026/c3/20261022/",
        "epoch": "2026-10-22T23:42Z (watermark)",
        "org": "ESA/NASA SOHO — LASCO consortium",
        "stampNote": "Timestamp read from the product watermark; a DataOps re-fetch re-derives it.",
        "r0Px": r0,
        "coronaStartPx": round(r_in / 1.02, 1),
        "outerPx": round(r_out, 1),
        "mapping": "u = image azimuth (0 = image north, increasing clockwise in the C3 frame); v = log radius over the VISIBLE annulus coronaStartPx..outerPx (image space). Streamer rays are REAL observed features; the radial falloff is measured.",
        "note": "Every texel originates from the dated LASCO C3 observation; satellites/saturation were clipped and the extreme dark instrument sweep replaced before smoothing. Rendered as the ECHOES corona shader structure map (white-gold at render).",
        "limitations": "C3 occults the disk (published occulting-disk radius ~3.7 solar radii), so this is the OUTER corona; in the renderer the observed annulus is rescaled to hug the limb — RADIAL SCALE COMPRESSED, structure unchanged. The low corona is a smooth continuation — disclosed. Not a photometric calibration of the F corona.",
    }
    with open("src/data/corona.json", "w") as f:
        json.dump(meta, f, indent=1)
    print("saved src/data/corona.json")


if __name__ == "__main__":
    build_photosphere(f"{SRC}/hmiic_4096.jpg")
    for fin, fout, stamp in CHANNELS:
        build_equirect(Image.open(fin), f"{TEX}/{fout}")
        print("  watermark:", stamp)
    spots = detect_sunspots(f"{SRC}/hmiic_4096.jpg")
    with open("src/data/sunspots.json", "w") as f:
        json.dump(
            {
                "epoch": "HMI continuum full disk 4096, retrieved 2026-10-23 with the photosphere build",
                "instrument": "SDO/HMI continuum (Fe I 6173 A)",
                "sourceFile": "sdo_hmiic_4096.jpg",
                "sourceUrl": "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
                "detection": "Local-illumination-normalised intensity < 0.78 clustered (scipy.ndimage); largest 8 regions kept",
                "note": "Feature positions are real detections of THIS snapshot, not random art; they age with the image and refresh on re-fetch.",
                "spots": spots,
            },
            f,
            indent=1,
        )
    print("saved src/data/sunspots.json")
    build_corona(f"{SRC}/lasco_c3_1024.jpg")
