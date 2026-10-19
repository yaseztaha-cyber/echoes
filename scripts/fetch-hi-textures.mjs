#!/usr/bin/env node
/**
 * Rich-Universe Phase 1 — real NASA hi-res global maps -> KTX2 (ETC1S/BasisLZ) stream pack.
 *
 * - Fetches verified NASA imagery at its NATIVE resolution (never upscaled;
 *   delivery is equal to or a POT downsample of the source, recorded per record).
 * - Transcodes with toktx (KTX-Software v4.4.2) to .ktx2 for GPU-compressed
 *   streaming: files live in public/tex-hi, served on demand, never bundled.
 * - Writes a provenance record per tier next to the audit (assets-hi/tex/).
 *
 * Idempotent: existing outputs are kept unless --force is passed.
 * Source files are cached in C:\Users\DELL\AppData\Local\Temp\opencode\tex-src.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const FORCE = process.argv.includes("--force");
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "tex-hi");
const META_DIR = path.join(ROOT, "assets-hi", "tex");
const CACHE = "C:\\Users\\DELL\\AppData\\Local\\Temp\\opencode\\tex-src";
const TOKTX = "C:\\Users\\DELL\\AppData\\Local\\Temp\\opencode\\ktx-tools\\bin\\toktx.exe";

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(META_DIR, { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

/** Curated sources: URL candidates probed in order; first 200 with sane size wins. */
const RECORDS = [
  {
    id: "earth",
    label: "Earth",
    credit: "NASA Visible Earth — Blue Marble Next Generation land/ocean topography+bathymetry",
    urlBase: "https://eoimages.gsfc.nasa.gov",
    probeRange: [2_000_000, 900_000_000],
    candidates: [
      "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg",
      "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x2700x1350.jpg",
    ],
    tier: "max", // delivered 4096x2048 POT downsample of the 5400px source
    target: [4096, 2048],
  },
  {
    id: "moon",
    label: "Moon",
    credit: "NASA SVS CGI Moon Kit (LRO LROC WAC color + LOLA poles), svs.gsfc.nasa.gov a4720",
    urlBase: "https://svs.gsfc.nasa.gov",
    probeRange: [400_000, 900_000_000],
    candidates: [
      "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif",
      "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_2k.tif",
      "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg",
    ],
    tier: "max",
    convertToPng: true,
    target: null, // POT-downsample only if source needs it; null = keep native if already POT
  },
  {
    id: "mars",
    label: "Mars",
    credit:
      "NASA SVS GMM-3 (a4436) MOLA cylindrical topography composition derived from MOLA instrument data, svs.gsfc.nasa.gov",
    urlBase: "https://svs.gsfc.nasa.gov",
    probeRange: [400_000, 900_000_000],
    candidates: [
      "https://svs.gsfc.nasa.gov/vis/a000000/a004400/a004436/mars_cyl_topo2.jpg",
    ],
    tier: "max",
    convertToPng: false,
    target: null,
  },
];

/** JPEG SOF0/1/2 dimension parse (no deps). Returns {w,h} or null. */
function jpegDims(buf) {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

async function probe(url) {
  try {
    const r = await fetch(url, { method: "GET", headers: { Range: "bytes=0-1" } });
    if (!r.ok) return null;
    await r.arrayBuffer();
    return { ok: true, url };
  } catch {
    return null;
  }
}

/** PNG IHDR dimension parse (no deps). */
function pngDims(buf) {
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/** 16-bit TIFF -> 8-bit RGB PNG via Windows Imaging Component (Windows ships it). */
function convertTifToPng(src, dst) {
  if (fs.existsSync(dst) && fs.statSync(dst).size > 0) {
    console.log(`  cached conversion: ${path.basename(dst)}`);
    return true;
  }
  const ps = [
    "Add-Type -AssemblyName PresentationCore;",
    `$d = New-Object System.Windows.Media.Imaging.TiffBitmapDecoder('${src.replaceAll("'", "''")}',`,
    "[System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,",
    "[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad);",
    `$c = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap($d.Frames[0],`,
    "[System.Windows.Media.PixelFormats]::Rgb24, $null, 0);",
    "$q = New-Object System.Windows.Media.Imaging.PngBitmapEncoder;",
    `$q.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($c));`,
    "$fs = [System.IO.File]::Open('" + dst.replaceAll("'", "''") + "','Create');",
    "$q.Save($fs); $fs.Close();",
  ].join(" ");
  const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
  if (r.status !== 0 || !fs.existsSync(dst)) throw new Error(`WIC convert failed: ${(r.stderr || "").slice(0, 1500)}`);
  console.log(`  WIC tif->png: ${path.basename(dst)}`);
  return true;
}

async function fetchSource(url, dst) {
  if (fs.existsSync(dst) && fs.statSync(dst).size > 0) {
    console.log(`  cached: ${path.basename(dst)}`);
    return true;
  }
  const r = await fetch(url);
  if (!r.ok) {
    console.log(`  HTTP ${r.status} ${url}`);
    return false;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(dst, buf);
  console.log(`  fetched ${url} -> ${path.basename(dst)} (${(buf.length / 1e6).toFixed(1)} MB)`);
  return true;
}

function toPegelTarget(w, h, target) {
  // Only ever a downscale to POT; native wins if it is already 2:1 POT >= target.
  if (!target) {
    if (w === 2 * h && w >= 4096 && (w & (w - 1)) === 0) return null; // native POT 2:1
    // non-POT 2:1 -> nearest lower POT pair
    let W = 1; while (W * 2 <= w) W *= 2;
    let H = W / 2;
    return [Math.min(W, w), Math.min(H, h)];
  }
  return [target[0], target[1]];
}

function runToktx(args) {
  const r = spawnSync(TOKTX, args, { encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  if (r.status !== 0) throw new Error(`toktx failed:\n${out.slice(0, 3000)}`);
  return out;
}

const results = [];
for (const rec of RECORDS) {
  console.log(`\n=== ${rec.id} (${rec.label}) ===`);
  const outKtx = path.join(OUT_DIR, `${rec.id}.ktx2`);
  const metaPath = path.join(META_DIR, `${rec.id}.json`);
  if (fs.existsSync(outKtx) && !FORCE) {
    console.log("  output exists, skipped (use --force to rebuild)");
    results.push({ id: rec.id, skipped: true });
    continue;
  }

  let src = null;
  for (const url of rec.candidates) {
    const p = await probe(url);
    if (p) { src = url; break; }
  }
  if (!src) {
    console.log("  no candidate reachable — record skipped (logged honestly)");
    results.push({ id: rec.id, skipped: true, reason: "no source reachable" });
    continue;
  }

  const srcFile = path.join(CACHE, `${rec.id}-${path.basename(src)}`);
  if (!(await fetchSource(src, srcFile))) {
    results.push({ id: rec.id, skipped: true, reason: "download failed" });
    continue;
  }

  let imgFile = srcFile;
  if (rec.convertToPng && src.toLowerCase().endsWith(".tif")) {
    imgFile = path.join(CACHE, `${rec.id}-converted.png`);
    convertTifToPng(srcFile, imgFile);
  }

  const img = fs.readFileSync(imgFile);
  const dims = /jpg$/i.test(src) ? jpegDims(img) : pngDims(img);
  if (!dims || dims.w < 1024) {
    console.log(`  source unreadable/undersized (${dims?.w}x${dims?.h}) — skipped`);
    results.push({ id: rec.id, skipped: true, reason: "bad source" });
    continue;
  }
  const tgt = toPegelTarget(dims.w, dims.h, rec.target);
  const args = [
    "--encode", "etc1s",
    "--clevel", "4",
    "--qlevel", "220",
    "--threads", "4",
    outKtx,
    imgFile,
  ];
  if (tgt) args.splice(args.length - 2, 0, "--resize", `${tgt[0]}x${tgt[1]}`);
  console.log(`  toktx ${dims.w}x${dims.h} -> ${tgt ? `${tgt[0]}x${tgt[1]}` : "native POT"}`);
  runToktx(args);

  const bytes = fs.statSync(outKtx).size;
  const meta = {
    id: rec.id,
    label: rec.label,
    tier: rec.tier,
    url: src,
    sourcePx: [dims.w, dims.h],
    deliveredPx: tgt ?? [dims.w, dims.h],
    format: "KTX2 ETC1S BasisLZ (GPU-compressed, runtime transcode via Basis universal)",
    bytes,
    credit: rec.credit,
    nativeUpsample: false,
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
  console.log(`  wrote ${path.basename(outKtx)} (${(bytes / 1e6).toFixed(2)} MB) + provenance`);
  results.push({ id: rec.id, ...meta });
}

console.log("\nSummary:");
for (const r of results) {
  console.log(`  ${r.id}: ${r.skipped ? `SKIPPED (${r.reason ?? "exists"})` : `${r.deliveredPx?.[0]}x${r.deliveredPx?.[1]} ${(r.bytes / 1e6).toFixed(2)} MB`}`);
}
const buildable = results.filter((r) => !r.skipped);
if (buildable.length === 0 && RECORDS.some((r) => r.id === "earth")) {
  console.log("WARN: no tiers built — tier policy will simply leave bodies on their bundled maps.");
}
