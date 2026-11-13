/** Small deterministic 2D value-noise (no dependencies). */
export function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  let s = seed * 2654435761 >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const val = (ix: number, iz: number) => perm[(perm[ix & 255] + iz) & 255] / 255;
  const fade = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, z: number) => {
    const ix = Math.floor(x), iz = Math.floor(z); const fx = fade(x - ix), fz = fade(z - iz);
    const a = val(ix, iz), b = val(ix + 1, iz), c = val(ix, iz + 1), d = val(ix + 1, iz + 1);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  };
  const fbm = (x: number, z: number, oct = 4) => { let a = 0.5, f = 1, sum = 0, n = 0; for (let i = 0; i < oct; i++) { sum += a * noise(x * f, z * f); n += a; a *= 0.5; f *= 2.03; } return sum / n; };
  return { noise, fbm, rnd };
}
export const smoothstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
