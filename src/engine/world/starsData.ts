/**
 * Runtime decode + astronomy-derived mapping for the generated star catalogue
 * (src/data/stars/starCatalog.ts - HYG v4.4 excerpt, CC BY-SA 4.0, see audit A6).
 *
 * Per spec A18: RA/Dec -> direction, magnitude -> brightness/size, color index -> tint.
 * Pure math, no three.js dependency, so it stays unit-testable.
 */
import { STAR_COUNT, STAR_DATA_B64 } from "@/data/stars/starCatalog";

export const STAR_FIELD_LEN = 4;

let decoded: Float32Array | null = null;

/** [ra, dec, mag, B-V] per star, brightest-first, ICRS/J2000. */
export function decodeStars(): Float32Array {
  if (decoded) return decoded;
  const bytes = Uint8Array.from(atob(STAR_DATA_B64), (ch) => ch.charCodeAt(0));
  decoded = new Float32Array(bytes.buffer, bytes.byteOffset, STAR_COUNT * STAR_FIELD_LEN);
  return decoded;
}

/** Obliquity of the ecliptic, J2000 (arcsec 84381.448 / 3600 deg). */
export const ECLIPTIC_OBLIQUITY_DEG = 84381.448 / 3600;

/**
 * Catalogue equatorial direction to scene direction in the ECHOES frame
 * (Y-up, ecliptic in XZ; see docs/COORDINATE_FRAME_DESIGN.md). Chained as
 * math-basis RA/Dec unit vector -> rotate about X by obliquity -> remap axes
 * (appX = eqX, appY = northCelestialPole, appZ = -eqY) keeping right-handedness.
 */
export function starDirection(raDeg: number, decDeg: number, out: [number, number, number]) {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const cd = Math.cos(dec);
  const mx = cd * Math.cos(ra);
  const my = cd * Math.sin(ra);
  const mz = Math.sin(dec);
  const e = (ECLIPTIC_OBLIQUITY_DEG * Math.PI) / 180;
  const ce = Math.cos(e);
  const se = Math.sin(e);
  const ey = my * ce - mz * se;
  const ez = my * se + mz * ce;
  out[0] = mx;
  out[1] = ez;
  out[2] = -ey;
  return out;
}

/** Apparent flux relative to a mag-0 star: 10^(-0.4 m), gamma-compressed for display. */
export function starBrightness(mag: number) {
  const s = Math.pow(10, -0.4 * mag);
  return Math.min(Math.pow(s, 0.55), 1.6);
}

/**
 * Color index B-V -> temperature K (Ballesteros 2012), clamped to the visual
 * spectral range O..M. Missing/odd catalogue values fall back to A0 white.
 */
export function colorIndexToKelvin(bv: number) {
  const c = Math.max(-0.33, Math.min(2.0, bv));
  return 4600 * (1 / (0.92 * c + 1.7) + 1 / (0.92 * c + 0.62));
}

/** Blackbody approximation (Tanner Helland) -> rgb in 0..1. */
export function kelvinToRgb(k: number): [number, number, number] {
  const t = Math.max(1000, Math.min(40000, k)) / 100;
  let r: number;
  let g: number;
  let b: number;
  r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const q = (v: number) => Math.max(0, Math.min(1, v / 255));
  return [q(r), q(g), q(b)];
}

export interface StarGeometryData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

/** Unit directions + dpr-normalized point sizes + tinted colors for every catalogue star. */
export function buildStarGeometryData(keep = Infinity): StarGeometryData {
  const data = decodeStars();
  const n = Math.min(STAR_COUNT, Math.max(1, Math.floor(keep)));
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const dir: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const o = i * STAR_FIELD_LEN;
    starDirection(data[o], data[o + 1], dir);
    pos.set(dir, i * 3);
    const b = starBrightness(data[o + 2]);
    const [r, g, bl] = kelvinToRgb(colorIndexToKelvin(data[o + 3]));
    col.set([r * b, g * b, bl * b], i * 3);
    const t = Math.max(0, Math.min(1, (5 - data[o + 2]) / 6.46));
    size[i] = 1.15 + 2.4 * Math.pow(t, 1.5);
  }
  return { positions: pos, colors: col, sizes: size };
}
