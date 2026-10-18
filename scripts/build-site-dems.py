#!/usr/bin/env python3
"""
Phase 9a — real DEM patches at the 9 mission sites (build-time, stdlib only).

Sources (no Trek; Trek grayscale DEMs were rejected: 8-bit spread over +/-8000 m
gives ~62.7 m/step, ordering-critical vertical detail is destroyed):
  MOON  LOLA GDR LDEM_128  (LRO-L-LOLA-4-GDR-V1.0), 128 ppd, Int16, 236.9 m/px eq
        https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_128
  MARS  MOLA MEGDR radial (MGS-M-MOLA-5-MEGDR-L3-V1.0) megR 128-ppd tiles,
        Int16, 463 m/px eq (1 m vertical quantization, OFFSET 3396000)
        https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/megR00N090HB.img

Downloads use HTTP byte ranges (row windows only, ~128 B/row) so the full
~2.1 GB global product is never transferred.

Deliveries:
  src/assets/terrain/dem/dem-<artifactId>.png   256x256 16-bit grayscale PNG
      (PNG samples are big-endian Int16 meters relative to the patch offset)
  src/data/terrain/demCatalog.ts                 typed metadata for the engine
  assets-hi/dem/dem-<artifactId>.json            full provenance record

Storage format decisions (documented, loss-bounded):
  - vertical: Int16, 1 m/step, offset = floor(minH) - 128 m margin
    (worst loss 0.5 m, far below any displayed precision; patch relief spans
    are well inside +/-32767 m)
  - horizontal: 0.5-deg patch (mask +-0.25 deg around the site) bilinearly
    resampled from the native 128-ppd grid (64 native samples -> 256 px,
    a 4x upsample; native ground sample 236.9 m moon / 463 m mars eq)
  - patch rows run north->south, cols west->east (PNG top-left = NW corner)
"""

import json
import math
import re
import struct
import time
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_PNG = ROOT / "src" / "assets" / "terrain" / "dem"
OUT_CATALOG = ROOT / "src" / "data" / "terrain" / "demCatalog.ts"
OUT_META = ROOT / "assets-hi" / "dem"
CACHE = Path(r"C:\Users\DELL\AppData\Local\Temp\opencode\dem-cache")

MOON_LBL = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_128.lbl"
MOON_IMG = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_128.img"
MARS_DIR = "https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128"

ARTIFACTS = ROOT / "src" / "data" / "artifacts"
PATCH_HALF_DEG = 0.25
GRID = 256
UA = "NASA-Space-Apps-ECHOES-SiteDEM/9a (educational reconstruction)"

# ---------------------------------------------------------------------------
# tiny HTTP helpers with retry
# ---------------------------------------------------------------------------

def _get(url: str, headers: dict[str, str], binary: bool):
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as r:
                return (r.read() if binary else r.read().decode("utf-8", "replace"))
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"GET failed after retries: {url} ({last})")


def fetch_range(url: str, start: int, length: int) -> bytes:
    return _get(url, {"Range": f"bytes={start}-{start + length - 1}", "User-Agent": UA}, True)


def fetch_range_disk(url: str, tag: str, start: int, length: int) -> bytes:
    """Ranged GET persisted in the temp cache (reruns after failures don't re-download)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    p = CACHE / f"seg-{tag}-{start}-{length}.bin"
    if p.exists():
        return p.read_bytes()
    data = fetch_range(url, start, length)
    p.write_bytes(data)
    return data


def fetch_text(url: str, tag: str) -> str | None:
    CACHE.mkdir(parents=True, exist_ok=True)
    p = CACHE / f"{tag}.txt"
    if p.exists():
        return p.read_text("utf-8", "replace")
    try:
        t = _get(url, {"User-Agent": UA}, False)
    except RuntimeError as e:
        if "404" in str(e):
            return None
        raise
    p.write_text(t, "utf-8")
    return t


# ---------------------------------------------------------------------------
# PDS label parsing (plain "KEY = value" lines)
# ---------------------------------------------------------------------------

_MOLLA_KEYS = [
    "LINES", "LINE_SAMPLES", "SAMPLE_BITS", "SCALING_FACTOR", "OFFSET",
    "MAP_RESOLUTION", "MAP_SCALE", "MINIMUM_LATITUDE", "MAXIMUM_LATITUDE",
    "WESTERNMOST_LONGITUDE", "EASTERNMOST_LONGITUDE", "SAMPLE_TYPE",
]


def parse_lbl(text: str) -> dict[str, float] | None:
    d: dict[str, float] = {}
    for line in text.splitlines():
        m = re.match(r"\s*([A-Z][A-Z0-9_]+)\s*=\s*(.+?)\s*(?:/\*.*)?$", line)
        if not m:
            continue
        k, v = m.group(1), m.group(2).strip().rstrip(",")
        if k in _MOLLA_KEYS or k in {"RECORD_BYTES", "BYTES_PER_SAMPLE"} or "SCALING" in k or "OFFSET" in k:
            if k == "SAMPLE_TYPE":
                d[k] = v  # e.g. "MSB_INTEGER" / "LSB_INTEGER" (string)
                continue
            v = re.sub(r"<[^>]*>", "", v).strip()
            try:
                d[k] = float(v)
            except ValueError:
                pass
    return d


# ---------------------------------------------------------------------------
# site coordinates — parsed straight from the artifact data module
# (single source of truth: src/data/artifacts/*)
# ---------------------------------------------------------------------------

def sites_from_artifacts() -> list[dict]:
    out: list[dict] = []
    apollo_txt = (ARTIFACTS / "apollo.ts").read_text("utf-8")
    for m in re.finditer(
        r"n:\s*(\d+),\s*lm:\s*\"([^\"]+)\"[^)]*?lat:\s*(-?\d+(?:\.\d+)?),\s*lon:\s*(-?\d+(?:\.\d+)?)",
        apollo_txt,
        re.S,
    ):
        n, lm, lat, lon = m.group(1), m.group(2), float(m.group(3)), float(m.group(4))
        mm = re.search(rf"n:\s*{n},\s*lm:\s*\"{lm}\"[^)]*?region:\s*\"([^\"]+)\"", apollo_txt, re.S)
        out.append({"id": f"apollo-{n}", "world": "moon", "lat": lat, "lon": lon,
                    "region": mm.group(1) if mm else "", "lm": lm})
    seen: set[str] = {"apollo-12", "apollo-14", "apollo-15", "apollo-16", "apollo-17"}
    for fname in ["mars-others.ts", "opportunity.ts"]:
        txt = (ROOT / "src" / "data" / "artifacts" / fname).read_text("utf-8")
        for m in re.finditer(r"location:\s*\{\s*world:\s*\"(\w+)\"[^}]*?lat:\s*(-?\d+(?:\.\d+)?),\s*lon:\s*(-?\d+(?:\.\d+)?)", txt):
            world, lat, lon = m.group(1), float(m.group(2)), float(m.group(3))
            # find owning artifact id: nearest "id: \"...\"" before the location row
            before = txt[: m.start()]
            ids = re.findall(r"id:\s*\"([a-z0-9-]+)\"", before)
            aid = ids[-1] if ids else ""
            if not aid or aid in seen:
                continue
            seen.add(aid)
            reg = re.search(r"region:\s*\"([^\"]+)\"", txt[m.start(): m.end() + 400])
            out.append({"id": aid, "world": world, "lat": lat, "lon": lon,
                        "region": reg.group(1) if reg else "", "lm": ""})
    return out


# ---------------------------------------------------------------------------
# DEM access ---------------------------------------------------------------
# ---------------------------------------------------------------------------

class MoonDem:
    """LOLA GDR LDEM_128. Rows 0..23039 (lat 90 -> -90 at 128 ppd), cols 0..46079 (lon 0..360)."""

    def __init__(self):
        lbl = parse_lbl(fetch_text(MOON_LBL, "moon-ldem128-lbl"))
        required = ["RECORD_BYTES", "OFFSET", "SCALING_FACTOR", "LINES", "LINE_SAMPLES"]
        missing = [k for k in required if k not in lbl]
        if missing:
            raise RuntimeError(f"LDEM_128 label missing {missing}: got {list(lbl)}")
        self.records = int(lbl["LINES"])
        self.cols = int(lbl["LINE_SAMPLES"])
        self.scale = lbl["SCALING_FACTOR"]
        self.offset = lbl["OFFSET"]
        self.endian = ">" if "MSB" in str(lbl.get("SAMPLE_TYPE", "")) else "<"
        self.row_bytes = self.cols * 2
        rot = lbl.get("RECORD_BYTES", 0.0)
        if rot and abs(rot - self.row_bytes) > 1:
            raise RuntimeError(f"LDEM_128 RECORD_BYTES {rot} != row bytes {self.row_bytes}")
        self.rows_cache: dict[int, bytes] = {}

    def rows_for(self, lat0: float, lat1: float) -> tuple[int, int]:
        r_lo = max(0, math.floor((90.0 - lat1) * 128) - 1)
        r_hi = min(self.records - 1, math.floor((90.0 - lat0) * 128) + 1)
        return r_lo, r_hi

    def cols_for(self, lon: float) -> tuple[int, int]:
        return (
            max(0, math.floor(lon * 128) - 1),
            min(self.cols - 1, math.floor((lon + PATCH_HALF_DEG) * 128) + 1),
        )

    def ensure_rows(self, r_lo: int, r_hi: int, c_lo: int, c_hi: int):
        """Cache the needed column window of each needed row (one ranged GET per row,
        4-way parallel to keep the ~600-row total runtime sane)."""
        c_lo2 = max(0, c_lo)
        c_hi2 = min(self.cols - 1, c_hi)
        need = (c_hi2 - c_lo2 + 1) * 2
        todo = [r for r in range(r_lo, r_hi + 1) if r not in self.rows_cache]
        if not todo:
            return
        with ThreadPoolExecutor(max_workers=4) as pool:
            futs = {pool.submit(
                fetch_range_disk, MOON_IMG, f"moon-row-r_slice-{c_lo2}-{need}", r * self.row_bytes + c_lo2 * 2, need): r for r in todo}
            for f in futs:
                self.rows_cache[futs[f]] = f.result()


class MarsDem:
    """One MOLA MEGDR megR tile (a 44-deg lat band x 90-deg lon slice, 128 ppd, pixel-registered)."""

    def __init__(self, names: list[str], lat: float, lon0: float, lon1: float):
        cov = []
        for n in names:
            txt = fetch_text(f"{MARS_DIR}/{n}.lbl", f"mars-{n}")
            if txt is None:
                continue
            lbl = parse_lbl(txt)
            if not all(k in lbl for k in ("LINES", "LINE_SAMPLES", "MINIMUM_LATITUDE", "MAXIMUM_LATITUDE",
                                          "WESTERNMOST_LONGITUDE", "EASTERNMOST_LONGITUDE", "SCALING_FACTOR", "OFFSET")):
                continue
            if (lbl["MINIMUM_LATITUDE"] - 0.5 <= lat <= lbl["MAXIMUM_LATITUDE"] + 0.5
                    and lbl["WESTERNMOST_LONGITUDE"] - 1 <= lon0 and lon1 <= lbl["EASTERNMOST_LONGITUDE"] + 1):
                cov.append((n, lbl))
        if not cov:
            raise RuntimeError(f"no MOLA 128-ppd megR tile covers lat {lat}, lon [{lon0},{lon1}]")
        self.name, self.lbl = cov[0]
        self.rows = int(self.lbl["LINES"])
        self.cols = int(self.lbl["LINE_SAMPLES"])
        self.lat_min, self.lat_max = self.lbl["MINIMUM_LATITUDE"], self.lbl["MAXIMUM_LATITUDE"]
        self.lon_min, self.lon_max = self.lbl["WESTERNMOST_LONGITUDE"], self.lbl["EASTERNMOST_LONGITUDE"]
        self.scale = self.lbl["SCALING_FACTOR"]
        self.offset = self.lbl["OFFSET"]
        self.endian = ">" if "MSB" in str(self.lbl.get("SAMPLE_TYPE", "")) else "<"
        self.img = f"{MARS_DIR}/{self.name}.img"
        self.rows_cache: dict[int, bytes] = {}

    def rows_for(self, lat0: float, lat1: float) -> tuple[int, int]:
        r_lo = max(0, math.floor((self.lat_max - lat1) * 128) - 1)
        r_hi = min(self.rows - 1, math.floor((self.lat_max - lat0) * 128) + 1)
        return r_lo, r_hi

    def cols_for(self, lon: float) -> tuple[int, int]:
        c_lo = math.floor((lon - self.lon_min) * 128) - 1
        c_hi = math.floor((lon + PATCH_HALF_DEG - self.lon_min) * 128) + 1
        return c_lo, c_hi

    def ensure_rows(self, r_lo: int, r_hi: int, c_lo: int, c_hi: int):
        c_lo2 = max(0, c_lo)
        c_hi2 = min(self.cols - 1, c_hi)
        need = (c_hi2 - c_lo2 + 1) * 2
        todo = [r for r in range(r_lo, r_hi + 1) if r not in self.rows_cache]
        if not todo:
            return
        with ThreadPoolExecutor(max_workers=4) as pool:
            futs = {pool.submit(
                fetch_range_disk, self.img, f"{self.name}-{c_lo2}-{need}", r * self.cols * 2 + c_lo2 * 2, need): r for r in todo}
            for f in futs:
                self.rows_cache[futs[f]] = f.result()


# ---------------------------------------------------------------------------
# PNG 16-bit writer + roundtrip check
# ---------------------------------------------------------------------------

def png16(path: Path, w: int, data: list[int]):
    raw = bytearray()
    rows = [data[i * w: (i + 1) * w] for i in range(w)]
    for r in rows:
        raw.append(0)  # filter: none
        for v in r:
            raw += struct.pack(">h", v)
    comp = zlib.compress(bytes(raw), 9)

    def chunk(t: bytes, d: bytes) -> bytes:
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", w, w, 16, 0, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", comp) + chunk(b"IEND", b""))


def png16_roundtrip(path: Path, w: int) -> list[int]:
    b = path.read_bytes()
    idat = b""
    pos = 8
    while pos < len(b):
        ln = struct.unpack_from(">I", b, pos)[0]
        typ = b[pos + 4: pos + 8]
        data = b[pos + 8: pos + 8 + ln]
        if typ == b"IDAT":
            idat += data
        pos += 12 + ln
    raw = zlib.decompress(idat)
    out: list[int] = []
    stride = w * 2
    prev = bytearray(stride)
    for y in range(w):
        row = bytearray(raw[y * (stride + 1): (y + 1) * (stride + 1)])
        f = row[0]
        row = row[1:]
        if f == 0:
            cur = row
        elif f == 1:
            cur = bytearray(stride)
            for i in range(stride):
                cur[i] = (row[i] + (cur[i - 2] if i >= 2 else 0)) & 0xFF
        elif f == 2:
            cur = bytearray((row[i] + prev[i]) & 0xFF for i in range(stride))
        elif f == 3:
            cur = bytearray(stride)
            for i in range(stride):
                a = cur[i - 2] if i >= 2 else 0
                cur[i] = (row[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif f == 4:
            cur = bytearray(stride)
            for i in range(stride):
                a = cur[i - 2] if i >= 2 else 0
                c = prev[i - 2] if i >= 2 else 0
                bb = prev[i]
                p = a + bb - c
                pa, pb, pc = abs(p - a), abs(p - bb), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (bb if pb <= pc else c)
                cur[i] = (row[i] + pr) & 0xFF
        else:
            raise RuntimeError("bad filter")
        for i in range(w):
            out.append(struct.unpack_from(">h", cur, i * 2)[0])
        prev = cur
    assert len(out) == w * w
    return out


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> None:
    sites = sites_from_artifacts()
    want_ids = ["apollo-12", "apollo-14", "apollo-15", "apollo-16", "apollo-17",
                "sojourner", "spirit", "opportunity", "insight"]
    by_id = {s["id"]: s for s in sites if s["id"] in want_ids}
    missing = [i for i in want_ids if i not in by_id]
    if missing:
        raise RuntimeError(f"artifact sites not found for {missing}; got {sorted(by_id)}")
    print(f"sites: {len(by_id)}")

    moon = MoonDem()
    print(f"LDEM_128: {moon.records} rows x {moon.cols} cols, scale {moon.scale} m, offset {moon.offset}")
    candidates = [f"megr{lb}{h}{ln}hb"
                  for lb, h in (("00", "n"), ("44", "n"), ("44", "s"), ("88", "n"))
                  for ln in ("000", "090", "180", "270")]

    mars_by_site: dict[str, MarsDem] = {}

    catalog: list[dict] = []
    OUT_PNG.mkdir(parents=True, exist_ok=True)
    OUT_META.mkdir(parents=True, exist_ok=True)

    for sid in want_ids:
        s = by_id[sid]
        lat, lon = s["lat"], ((s["lon"] + 360.0) % 360.0)
        lat0, lat1 = lat - PATCH_HALF_DEG, lat + PATCH_HALF_DEG
        lon0, lon1 = lon - PATCH_HALF_DEG, lon + PATCH_HALF_DEG
        is_moon = s["world"] == "moon"
        if is_moon:
            src = moon
        else:
            if sid not in mars_by_site:
                m = MarsDem(candidates, lat, lon0, lon1)
                mars_by_site[sid] = m
                print(f"  {sid}: tile {m.name} lat[{m.lat_min},{m.lat_max}] lon[{m.lon_min},{m.lon_max}]")
            src = mars_by_site[sid]
        c_lo, c_hi = src.cols_for(lon)
        r_lo, r_hi = src.rows_for(lat0, lat1)
        print(f"{sid}: lat[{lat0:.4f},{lat1:.4f}] lon[{lon0:.4f},{lon1:.4f}] rows[{r_lo},{r_hi}] cols[{c_lo},{c_hi}]")
        t0 = time.time()
        src.ensure_rows(r_lo, r_hi, c_lo, c_hi)
        print(f"  rows cached: {len(src.rows_cache)} ({time.time() - t0:.1f} s)")

        scale = moon.scale if is_moon else src.scale
        offset_dn = moon.offset if is_moon else src.offset

        # sample: reuse row cache -> meters
        pix: list[int] = []
        hmin, hmax = 1e9, -1e9
        for gy in range(GRID):
            laty = lat1 - (lat1 - lat0) * gy / (GRID - 1)
            for gx in range(GRID):
                lonx = lon0 + (lon1 - lon0) * gx / (GRID - 1)
                if is_moon:
                    fra = (90.0 - laty) * 128.0 - 0.5
                    fco = lonx * 128.0 - 0.5 - c_lo
                else:
                    fra = (src.lat_max - laty) * 128.0 - 0.5
                    fco = (lonx - src.lon_min) * 128.0 - c_lo
                r0, c0i = math.floor(fra), math.floor(fco)
                if r0 < 0 or r0 + 1 not in src.rows_cache:
                    raise RuntimeError(f"{sid}: row {r0} outside cached window")
                ty, tx = fra - r0, fco - c0i
                base0 = src.rows_cache[r0]
                base1 = src.rows_cache[r0 + 1]
                v0 = struct.unpack_from(src.endian + "h", base0, (c0i) * 2)[0]
                v1 = struct.unpack_from(src.endian + "h", base0, (c0i + 1) * 2)[0]
                v2 = struct.unpack_from(src.endian + "h", base1, (c0i) * 2)[0]
                v3 = struct.unpack_from(src.endian + "h", base1, (c0i + 1) * 2)[0]
                hdn = ((v0 * (1 - tx) + v1 * tx) * (1 - ty) + (v2 * (1 - tx) + v3 * tx) * ty)
                h_m = hdn * scale + offset_dn
                pix.append(h_m)
                if h_m < hmin:
                    hmin = h_m
                if h_m > hmax:
                    hmax = h_m
        off = math.floor(hmin) - 128
        qs = [int(round(v - off)) for v in pix]
        clipped = sum(1 for q in qs if q > 32767)
        if clipped:
            raise RuntimeError(f"{sid}: {clipped} samples exceed Int16 (span {hmin:.1f}..{hmax:.1f})")
        png_name = f"dem-{sid}.png"
        png16(OUT_PNG / png_name, GRID, qs)
        check = png16_roundtrip(OUT_PNG / png_name, GRID)
        ok = all(abs((check[i] + off) - pix[i]) <= 0.51 for i in range(0, GRID * GRID, 97))
        if not ok:
            raise RuntimeError(f"{sid}: PNG roundtrip failed")

        native_ppd = 128
        gsp_native_m = (1737.4 * 1000.0 * math.pi / 180 / 128) if s["world"] == "moon" else (3396.2 * 1000.0 * math.pi / 180 / 128)
        src_meta = ({
            "product": "LOLA GDR LDEM_128 (LRO-L-LOLA-4-GDR-V1.0)",
            "lbl": MOON_LBL, "img": MOON_IMG,
            "org": "NASA / MIT / GSFC (LRO LOLA team)",
        } if is_moon else {
            "product": f"MOLA MEGDR 128-ppd radial tile {src.name} (MGS-M-MOLA-5-MEGDR-L3-V1.0)",
            "lbl": f"{MARS_DIR}/{src.name}.lbl", "img": src.img,
            "org": "NASA / GSFC (MGS MOLA team)",
        })
        meta = {
            "id": f"dem-{sid}",
            "artifactId": sid,
            "world": s["world"],
            "site": s["region"],
            "lm": s["lm"],
            "centerLat": lat,
            "centerLon_east": lon,
            "patchHalfDeg": PATCH_HALF_DEG,
            "grid": GRID,
            "hScale": 1.0,
            "hOffset_m": off,
            "reliefMin_m": round(hmin, 1),
            "reliefMax_m": round(hmax, 1),
            "png": png_name,
            "nativePpd": native_ppd,
            "nativeGsp_m": round(gsp_native_m, 1),
            "deliveredGsp_m": round(((lat1 - lat0) / 180 * math.pi * (3396.2 if s["world"] == "mars" else 1737.4) * 1000) / (GRID - 1), 1),
            "source": src_meta,
        }
        (OUT_META / f"dem-{sid}.json").write_text(json.dumps(meta, indent=2) + "\n", "utf-8")
        size = (OUT_PNG / png_name).stat().st_size
        rel = hmax - hmin
        print(f"  {png_name}: relief {rel:.0f} m ({hmin:.0f}..{hmax:.0f}), offset {off} m, {size/1024:.0f} KB")
        catalog.append(meta)

    ts = Path(OUT_CATALOG)
    ts.write_text(
        "// AUTO-GENERATED by scripts/build-site-dems.py — DO NOT EDIT BY HAND.\n"
        "// Real DEM patches at the 9 mission sites: 256x256 Int16-metres PNGs\n"
        "// (value = pixel + hOffset_m * hScale). Provenance in manifest.ts and\n"
        "// docs/PLANETARY_ASSET_AUDIT.md; re-run the script to regenerate.\n"
        "export interface SiteDem {\n"
        "  artifactId: string;\n"
        "  world: \"moon\" | \"mars\";\n"
        "  file: string; // src/assets/terrain/dem/<file>, imported directly by the engine\n"
        "  centerLat: number;\n"
        "  centerLonEast: number;\n"
        "  patchHalfDeg: number;\n"
        "  grid: number;\n"
        "  hScale: number;\n"
        "  hOffsetM: number;\n"
        "  reliefMinM: number;\n"
        "  reliefMaxM: number;\n"
        "  nativeGspM: number;\n"
        "  deliveredGspM: number;\n"
        "  product: string;\n"
        "  org: string;\n"
        "}\n\n"
        "export const SITE_DEM_CATALOG: SiteDem[] = " + json.dumps([
            {"artifactId": c["artifactId"], "world": c["world"], "file": c["png"],
             "centerLat": c["centerLat"], "centerLonEast": c["centerLon_east"],
             "patchHalfDeg": c["patchHalfDeg"], "grid": c["grid"], "hScale": c["hScale"],
             "hOffsetM": c["hOffset_m"], "reliefMinM": c["reliefMin_m"], "reliefMaxM": c["reliefMax_m"],
             "nativeGspM": c["nativeGsp_m"], "deliveredGspM": c["deliveredGsp_m"],
             "product": c["source"]["product"], "org": c["source"]["org"]}
            for c in catalog
        ], indent=2) + ";\n",
        "utf-8",
    )
    print(f"catalog: {ts} ({len(catalog)} sites)")


if __name__ == "__main__":
    main()
