/** Procedural terrain height. Deterministic, shared by the tile streamer, rover placement and walking. */
export type TerrainWorld = "mars" | "moon";
export const terrainState = { world: "mars" as TerrainWorld, seed: 7 };

function hash2(ix: number, iz: number, s: number) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x: number, z: number, s: number) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, s), b = hash2(ix + 1, iz, s), c = hash2(ix, iz + 1, s), d = hash2(ix + 1, iz + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, z: number, oct: number, s: number) {
  let amp = 0.5, f = 1, sum = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * vnoise(x * f, z * f, s + i * 17);
    f *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

function craters(x: number, z: number, cell: number, depthK: number, seed: number, prob: number) {
  const cx = Math.floor(x / cell), cz = Math.floor(z / cell);
  let h = 0;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ix = cx + dx, iz = cz + dz;
      if (hash2(ix, iz, seed) > prob) continue;
      const px = (ix + 0.15 + 0.7 * hash2(ix, iz, seed + 1)) * cell;
      const pz = (iz + 0.15 + 0.7 * hash2(ix, iz, seed + 2)) * cell;
      const rad = cell * (0.1 + 0.3 * hash2(ix, iz, seed + 3));
      const d = Math.hypot(x - px, z - pz) / rad;
      if (d > 2.2) continue;
      const depth = rad * depthK;
      if (d < 1) h -= depth * (1 - d * d);
      const q = (d - 1.02) / 0.25;
      h += depth * 0.32 * Math.exp(-q * q);
      if (d > 1) h += depth * 0.1 * Math.exp(-(d - 1) * 2.6);
    }
  }
  return h;
}

function bowl(x: number, z: number, cx: number, cz: number, rad: number, depth: number, rim: number) {
  const d = Math.hypot(x - cx, z - cz) / rad;
  if (d > 3) return 0;
  let h = 0;
  if (d < 1) h -= depth * (1 - d * d);
  const q = (d - 1.02) / 0.18;
  h += rim * Math.exp(-q * q);
  if (d > 1) h += rim * 0.35 * Math.exp(-(d - 1) * 3);
  return h;
}

// Documented crater positions near Meridiani Planum (approximate, metres east/south of landing).
const MER_FEATURES: [number, number, number, number, number][] = [
  [0, 0, 11, 2.6, 0.9], // Eagle
  [330, 640, 65, 20, 6], // Endurance
  [1550, 5900, 365, 70, 14], // Victoria
];

export function heightAt(x: number, z: number): number {
  const { world, seed } = terrainState;
  if (world === "mars") {
    let h = (fbm(x / 3200, z / 3200, 4, seed) - 0.5) * 18;
    h += (fbm(x / 160, z / 160, 3, seed + 3) - 0.5) * 2.2;
    // wind ripples
    const w = fbm(x / 600, z / 600, 2, seed + 9) * 6;
    h += 0.16 * Math.sin((x * 0.74 + z * 0.31) / 3.2 + w) * (0.4 + fbm(x / 90, z / 90, 2, seed + 11));
    h += craters(x, z, 55, 0.2, seed + 20, 0.22);
    h += craters(x, z, 260, 0.2, seed + 30, 0.3);
    h += craters(x, z, 1400, 0.14, seed + 40, 0.4);
    if (seed === 7) {
      for (const f of MER_FEATURES) h += bowl(x, z, f[0], f[1], f[2], f[3], f[4]);
      // Endeavour crater rim (≈22 km) — centre placed so the rim passes through the documented waypoints
      const d = Math.hypot(x - 15800, z - 19500) / 11000;
      if (d < 1.4) {
        const q = (d - 1) / 0.07;
        h += 150 * Math.exp(-q * q) - (d < 1 ? 330 * Math.pow(1 - d, 1.4) * (1 - d * 0.4) : 0);
        if (d > 1) h += 40 * Math.exp(-(d - 1) * 9);
      }
    }
    return h;
  }
  let h = (fbm(x / 3000, z / 3000, 4, seed) - 0.5) * 60;
  h += (fbm(x / 140, z / 140, 3, seed + 3) - 0.5) * 3.5;
  h += craters(x, z, 28, 0.2, seed + 20, 0.5);
  h += craters(x, z, 110, 0.2, seed + 30, 0.5);
  h += craters(x, z, 480, 0.17, seed + 40, 0.5);
  h += craters(x, z, 2400, 0.13, seed + 50, 0.55);
  // keep the immediate landing area gentle
  const k = Math.min(1, Math.hypot(x, z) / 90);
  return h * (0.35 + 0.65 * k * k);
}

export function slopeAt(x: number, z: number) {
  const e = 1.5;
  const dx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e);
  const dz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
  return Math.atan(Math.hypot(dx, dz)) * (180 / Math.PI);
}

/**
 * Footprint grounding for spacecraft. Samples the terrain under the whole
 * footprint (centre + 4 rim points) and rests the frame on the HIGHEST sample,
 * so no leg or wheel dives below the surface. Returns a small tilt from the
 * rim deltas so the frame sits with the slope instead of floating above it.
 * `settle` sinks the frame slightly (wheels compress soil — physical).
 */
export function footprintPose(
  x: number,
  z: number,
  r: number,
  settle = 0.03
): { y: number; pitch: number; roll: number } {
  if (!(r > 0)) {
    return { y: heightAt(x, z), pitch: 0, roll: 0 };
  }
  const c = heightAt(x, z);
  const e = heightAt(x + r, z);
  const w = heightAt(x - r, z);
  const s = heightAt(x, z + r);
  const n = heightAt(x, z - r);
  return {
    y: Math.max(c, e, w, s, n) - settle,
    pitch: Math.atan2(n - s, 2 * r),
    roll: Math.atan2(w - e, 2 * r),
  };
}
