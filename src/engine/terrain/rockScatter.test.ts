import { describe, expect, it } from "vitest";
import { rockScatter } from "./rockScatter";

const y0 = () => 0;

describe("rockScatter", () => {
  it("keeps the rng stream count-independent: trimmed tiers reshuffle nothing", () => {
    const full = rockScatter(42, 150, 240, y0);
    const med = rockScatter(42, 150, 144, y0); // medium tier of the same site
    const low = rockScatter(42, 150, 84, y0); // low tier
    expect(med.length).toBe(144);
    expect(low.length).toBe(84);
    for (let i = 0; i < 84; i++) {
      expect(low[i]).toEqual(med[i]);
      expect(med[i]).toEqual(full[i]);
    }
  });

  it("respects the hardware clearing and near-field size discipline", () => {
    const items = rockScatter(7, 150, 240, y0);
    expect(items.length).toBe(240);
    for (const r of items) {
      const d = Math.hypot(r.x, r.z);
      expect(d).toBeGreaterThanOrEqual(12);
      expect(d).toBeLessThanOrEqual(150);
      if (d < 20) expect(r.s).toBeLessThanOrEqual(0.58); // 0.5 cap + base
    }
  });
});
