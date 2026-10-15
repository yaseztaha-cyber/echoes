import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GLOBE_MANIFEST, globeAssetFor, validateManifest } from "./manifest";

const TEX = join(__dirname, "..", "..", "assets", "tex");

describe("globe asset manifest", () => {
  it("validates with zero provenance problems", () => {
    expect(validateManifest(GLOBE_MANIFEST)).toEqual([]);
  });

  it("covers exactly the three renderer globe kinds", () => {
    expect(GLOBE_MANIFEST.map((m) => m.body).sort()).toEqual(["earth", "mars", "moon"]);
    for (const kind of ["earth", "moon", "mars"] as const) {
      const m = globeAssetFor(kind);
      expect(m?.body).toBe(kind);
      expect(m?.status).toBe("APPROVED");
    }
  });

  it("returns null for bodies without a verified map (no silent fallback)", () => {
    expect(globeAssetFor("jupiter")).toBeNull();
    expect(globeAssetFor("sun")).toBeNull();
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
      const p = join(TEX, `${m.body}.jpg`);
      expect(existsSync(p), p).toBe(true);
      expect(statSync(p).size).toBeGreaterThan(100_000);
    }
  });

  it("catches bad records (validator is not a rubber stamp)", () => {
    const bad = [{ ...GLOBE_MANIFEST[0], sourceUrl: "http://x", colorSpace: "NoColorSpace" } as never];
    expect(validateManifest(bad as never).length).toBeGreaterThan(0);
    expect(validateManifest([])).toEqual([]);
  });
});
