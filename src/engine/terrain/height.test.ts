import { describe, expect, it } from "vitest";
import { footprintPose, heightAt, terrainState } from "./height";

describe("footprint grounding", () => {
  it("rests on the highest sample under the footprint (never dives)", () => {
    terrainState.world = "mars";
    terrainState.seed = 7;
    for (const [x, z, r] of [[0, 0, 1.3], [330, 640, 1.3], [5150, 21600, 4.6], [-3000, 9000, 1.6]] as const) {
      const p = footprintPose(x, z, r);
      const samples = [heightAt(x, z), heightAt(x + r, z), heightAt(x - r, z), heightAt(x, z + r), heightAt(x, z - r)];
      expect(p.y).toBeGreaterThanOrEqual(Math.max(...samples) - 0.031);
      expect(p.y).toBeLessThanOrEqual(Math.max(...samples));
    }
  });
  it("zero radius returns the exact surface point with no tilt", () => {
    const p = footprintPose(100, -200, 0);
    expect(p.y).toBe(heightAt(100, -200));
    expect(p.pitch).toBe(0);
    expect(p.roll).toBe(0);
  });
  it("tilt stays within sane bounds on real terrain", () => {
    for (const [x, z] of [[0, 0], [330, 640], [15800, 19500], [4800, 17100]] as const) {
      const p = footprintPose(x, z, 4.6);
      expect(Math.abs(p.pitch)).toBeLessThan(0.5);
      expect(Math.abs(p.roll)).toBeLessThan(0.5);
      expect([p.y, p.pitch, p.roll].every(Number.isFinite)).toBe(true);
    }
  });
  it("is deterministic", () => {
    expect(footprintPose(10, 20, 1.3)).toEqual(footprintPose(10, 20, 1.3));
  });
});
