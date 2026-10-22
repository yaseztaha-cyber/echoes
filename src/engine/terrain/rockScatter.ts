/** Pure rock scatter (headless-testable): placement rules separated from React. */

export interface RockItem {
  x: number;
  z: number;
  y: number;
  s: number;
  ry: number;
  tone: number;
}

/** Seeded PRNG (mulberry-ish). Deterministic scatter, no surveyed positions claimed. */
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/**
 * The rng stream is count-independent — exactly 5 rolls per rock — so the
 * first n items of an m-scatter equal the whole of an n-scatter. Quality
 * tiers trim count without reshuffling the visible landscape.
 */
export function rockScatter(
  seed: number,
  radius: number,
  count: number,
  sampleY: (x: number, z: number) => number
): RockItem[] {
  const r = rng(seed * 31 + 7);
  const items: RockItem[] = [];
  let guard = 0;
  while (items.length < count && guard++ < count * 30) {
    const a = r() * Math.PI * 2;
    // Keep the device clearing open: hardware sits near the origin and
    // close-up inspection must not stare into a boulder.
    const d = 12 + Math.pow(r(), 1.4) * (radius - 12);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    // near-field discipline: modest rocks just outside the clearing, full
    // sizes only beyond 20 m, so close-up inspection stays readable
    const cap = d < 20 ? 0.5 : 1.18;
    const s = 0.08 + Math.pow(r(), 2.4) * cap;
    items.push({ x, y: sampleY(x, z) + s * 0.12, z, s, ry: r() * Math.PI * 2, tone: r() });
  }
  return items;
}
