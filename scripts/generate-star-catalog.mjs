/**
 * starCatalog generator (provenance-critical; keep in repo).
 *
 * Source: HYG v4.4 database (Hipparcos + Yale Bright Star + Gliese merge),
 *   https://codeberg.org/astronexus/hyg  (CC BY-SA 4.0)
 * Usage: node scripts/generate-star-catalog.mjs <path/to/hyg_v44.csv.gz>
 * Output: src/data/stars/starCatalog.ts (base64 Float32Array, fields RA[deg], DEC[deg], VMAG, B-V)
 *
 * Filter, per spec A18 (naked-eye visible, restrained point count):
 *   - 2000.0 epoch equatorial coordinates
 *   - apparent visual magnitude mag <= 6.0
 *   - drops proper name "Sol" (the Sun itself)
 *   - rows without mag or ra/dec are dropped
 * Rows are sorted brightest-first so a caller may cap with a lower `count`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const [, , inPath] = process.argv;
if (!inPath) {
  console.error("usage: generate-star-catalog.mjs <hyg_v44.csv.gz>");
  process.exit(1);
}

const MAG_MAX = 6.0;
const OUT = fileURLToPath(new URL("../src/data/stars/starCatalog.ts", import.meta.url));

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
const b64 = Buffer.from(flat.buffer, flat.byteOffset, flat.byteLength).toString("base64");

mkdirSync(fileURLToPath(new URL("../src/data/stars", import.meta.url)), { recursive: true });

const year = new Date().toISOString().slice(0, 10);
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
