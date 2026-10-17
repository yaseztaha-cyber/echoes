import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GLOBE_MANIFEST, globeAssetFor, validateManifest } from "./manifest";

const TEX = join(__dirname, "..", "..", "assets", "tex");

describe("globe asset manifest", () => {
  it("validates with zero provenance problems", () => {
    expect(validateManifest(GLOBE_MANIFEST)).toEqual([]);
  });

  it("covers every renderer globe body with its surface/default view", () => {
    for (const kind of ["earth", "moon", "mars", "mercury", "venus", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const) {
      const m = globeAssetFor(kind);
      expect(m?.body).toBe(kind);
      expect(m?.status).toBe("APPROVED");
      expect(m?.flat).not.toBe(true);
    }
    // venus resolves to radar surface, never the representative clouds, by accident
    expect(globeAssetFor("venus")?.id).toBe("venus-magellan");
  });

  it("returns null for bodies without a verified map (no silent fallback)", () => {
    expect(globeAssetFor("titan")).toBeNull();
    expect(globeAssetFor("europa")).toBeNull();
    expect(globeAssetFor("")).toBeNull();
  });

  it("never upscales: delivered resolution within source resolution", () => {
    for (const m of GLOBE_MANIFEST) {
      expect(m.deliveredPx[0]).toBeLessThanOrEqual(m.sourcePx[0]);
      expect(m.deliveredPx[1]).toBeLessThanOrEqual(m.sourcePx[1]);
    }
  });

  it("delivered files exist on disk and are non-trivial", () => {
    for (const m of GLOBE_MANIFEST) {
      const p = m.flat
        ? join(__dirname, "..", "..", "assets", m.body === "sun" ? "sun" : "nasa", `${m.sourceFile}`)
        : join(TEX, m.view === "clouds" ? "venus_clouds.jpg" : m.body === "sun" ? "sun.jpg" : `${m.body}.jpg`);
      expect(existsSync(p), p).toBe(true);
      expect(statSync(p).size).toBeGreaterThan(4_000);
    }
  });

  it("hi-res runtime delivery is disabled (spec §2: bundled ≤2048px maps only)", () => {
    const hi = GLOBE_MANIFEST.filter((m) => "hiresUrl" in m);
    expect(hi).toEqual([]);
    expect(existsSync(join(__dirname, "..", "..", "..", "public", "tex-hi"))).toBe(false);
  });

  it("every entry carries an explicit scientific classification", () => {
    const allowed = ["OBSERVED", "MOSAIC", "ENHANCED", "REPRESENTATIVE", "RECONSTRUCTED", "SIMULATED"];
    for (const m of GLOBE_MANIFEST) {
      expect(allowed.some((c) => m.class.includes(c)), m.id).toBe(true);
      expect(m.epoch.length).toBeGreaterThan(3);
    }
  });

  it("catches bad records (validator is not a rubber stamp)", () => {
    const bad = [{ ...GLOBE_MANIFEST[0], sourceUrl: "http://x", colorSpace: "NoColorSpace" } as never];
    expect(validateManifest(bad as never).length).toBeGreaterThan(0);
    expect(validateManifest([])).toEqual([]);
  });
});
