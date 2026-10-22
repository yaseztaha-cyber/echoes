/**
 * starCatalog generator (provenance-critical; keep in repo).
 *
 * Source: HYG v4.4 database (Hipparcos + Yale Bright Star + Gliese merge),
 *   https://codeberg.org/astronexus/hyg  (CC BY-SA 4.0)
 * Usage:
 *   node scripts/generate-star-catalog.mjs <hyg_v44.csv.gz> [--mag 6.0] [--out src/data/stars/starCatalog.ts]
 *   --out ending in .ts   -> typed module with base64 payload (bundled catalog)
 *   --out ending in .bin  -> raw little-endian Float32 file in public/ (streamed
 *                            deep catalog, never bundled; fetched lazily at runtime)
 * Output fields (Float32 x4 per record): RA[deg], DEC[deg], VMAG, B-V
 *
 * Filter, per spec A18 (naked-eye visible, restrained point count) and the
 * rich-universe phase (deep population, still real catalogue rows only):
 *   - 2000.0 epoch equatorial coordinates
 *   - apparent visual magnitude mag <= --mag (default 6.0 naked-eye)
 *   - drops proper name "Sol" (the Sun itself)
 *   - rows without mag or ra/dec are dropped
 * Rows are sorted brightest-first so a caller may cap with a lower `count`.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const inPath = args[0];
if (!inPath) {
  console.error("usage: generate-star-catalog.mjs <hyg_v44.csv.gz> [--mag 6.0] [--out <file>]");
  process.exit(1);
}
const magIdx = args.indexOf("--mag");
const MAG_MAX = magIdx >= 0 ? Number(args[magIdx + 1]) : 6.0;
const outIdx = args.indexOf("--out");
const OUT = outIdx >= 0 ? fileURLToPath(new URL(`../${args[outIdx + 1]}`, import.meta.url)) : fileURLToPath(new URL("../src/data/stars/starCatalog.ts", import.meta.url));

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

const raw = gunzipSync(readFileSync(inPath));
const text = raw.toString("utf8");
const lines = text.split("\n");
const header = splitCsvLine(lines[0].replace(/\r$/, ""));
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
const need = ["ra", "dec", "mag", "ci", "proper"];
for (const k of need) if (idx[k] === undefined) { console.error(`missing column: ${k} (had: ${header.join("|")})`); process.exit(1); }

const f = (v) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; };
const stars = [];
let noCi = 0;
let sunDropped = 0;

for (let li = 1; li < lines.length; li++) {
  const line = lines[li];
  if (!line || line === "\r") continue;
  const c = splitCsvLine(line);
  // HYG v4.x stores RA in HOURS (v3 stored degrees); convert to degrees here.
  const raDeg = f(c[idx.ra]) * 15;
  const dec = f(c[idx.dec]), mag = f(c[idx.mag]), ci = f(c[idx.ci]);
  const proper = (c[idx.proper] || "").trim();
  if (proper === "Sol") { sunDropped++; continue; }
  if (!Number.isFinite(raDeg) || !Number.isFinite(dec) || !Number.isFinite(mag)) continue;
  if (mag > MAG_MAX) continue;
  if (!Number.isFinite(ci)) { noCi++; continue; }
  stars.push([raDeg, dec, mag, ci]);
}

stars.sort((a, b) => a[2] - b[2]); // brightest first

const flat = new Float32Array(stars.length * 4);
stars.forEach((s, i) => flat.set(s, i * 4));

const year = new Date().toISOString().slice(0, 10);

if (OUT.endsWith(".bin")) {
  // Streamed deep catalog: raw little-endian Float32, served from public/,
  // fetched + decoded lazily at runtime. Never enters the single-file bundle.
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, Buffer.from(flat.buffer, flat.byteOffset, flat.byteLength));
  const bytes = statSync(OUT).size;
  console.log(`deep stars: ${stars.length} rows -> ${OUT} (${(bytes / 1e6).toFixed(2)} MB raw)`);
  console.log(`min mag: ${stars[0][2]}, max mag: ${stars[stars.length - 1][2]}`);
  process.exit(0);
}

const b64 = Buffer.from(flat.buffer, flat.byteOffset, flat.byteLength).toString("base64");
mkdirSync(fileURLToPath(new URL("../src/data/stars", import.meta.url)), { recursive: true });
const banner = `/**
 * Naked-eye star catalogue excerpt - GENERATED FILE, do not edit by hand.
 *
 * Source: HYG v4.4 (Hipparcos/Yale/Gliese), https://codeberg.org/astronexus/hyg
 * License: CC BY-SA 4.0 (attribution preserved in docs/PLANETARY_ASSET_AUDIT.md A6)
 * Coordinates: ICRS/J2000 equatorial (RA deg - converted from HYG v4.x hours x15 - DEC deg);
 * mag = apparent V; ci = B-V color index.
 * Filter: mag <= ${MAG_MAX.toFixed(1)}, Sun dropped, rows sorted brightest-first.
 * Generated ${year} by scripts/generate-star-catalog.mjs; re-run with the original csv.gz to regenerate.
 *
 * Encoding: base64 of a little-endian Float32Array (${stars.length} records x 4 fields).
 * Decode at runtime with decodeStars() from src/engine/world/starsData.ts.
 */
export const STAR_COUNT = ${stars.length};
export const STAR_MAG_MAX = ${MAG_MAX.toFixed(1)};
export const STAR_DATA_B64 =
  "${b64}";
`;

writeFileSync(OUT, banner);
console.log(`stars: ${stars.length} (no color index: ${noCi}, sun dropped: ${sunDropped})`);
console.log(`min mag: ${stars[0][2]}, max mag: ${stars[stars.length - 1][2]}`);
console.log(`wrote ${OUT} (${(banner.length / 1024).toFixed(1)} KB)`);
