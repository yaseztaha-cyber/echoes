import { describe, expect, it } from "vitest";
import { proximityState } from "./geo";
import { MER_OFFICIAL_META, MER_OFFICIAL_URL, MER_YAW } from "@/engine/spacecraft/merOfficial";

describe("proximity states (single authoritative thresholds)", () => {
  it("maps range to context, boundaries inclusive at the low end", () => {
    expect(proximityState(0)).toBe("ROVER INSPECTION");
    expect(proximityState(39.9)).toBe("ROVER INSPECTION");
    expect(proximityState(40)).toBe("MISSION SITE");
    expect(proximityState(499)).toBe("MISSION SITE");
    expect(proximityState(500)).toBe("REGIONAL APPROACH");
    expect(proximityState(4999)).toBe("REGIONAL APPROACH");
    expect(proximityState(5000)).toBe("PLANETARY APPROACH");
    expect(proximityState(28400)).toBe("PLANETARY APPROACH");
  });
  it("is deterministic and total (every distance has exactly one state)", () => {
    for (const d of [0, 1, 39, 40, 41, 499, 500, 501, 4999, 5000, 5001, 1e6]) {
      expect(["PLANETARY APPROACH", "REGIONAL APPROACH", "MISSION SITE", "ROVER INSPECTION"]).toContain(proximityState(d));
    }
  });
});

describe("official MER model record", () => {
  it("points at the versioned NASA CDN asset over https", () => {
    expect(MER_OFFICIAL_URL.startsWith("https://assets.science.nasa.gov/")).toBe(true);
    expect(MER_OFFICIAL_URL.endsWith("MER_static.glb")).toBe(true);
  });
  it("records the verified binary facts (single merged mesh, metric scale)", () => {
    expect(MER_OFFICIAL_META.meshes).toBe(1);
    expect(MER_OFFICIAL_META.groundAtY).toBe(0);
    expect(MER_OFFICIAL_META.footprintM.x).toBeCloseTo(2.28, 1);
    expect(MER_OFFICIAL_META.mastTopM).toBeCloseTo(1.58, 1);
  });
  it("yaw correction is a pure -90 degree rotation about Y", () => {
    expect(MER_YAW).toBeCloseTo(-Math.PI / 2, 12);
  });
});
