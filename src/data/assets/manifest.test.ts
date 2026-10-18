import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GLOBE_MANIFEST,
  SITE_DEM_MANIFEST,
  globeAssetFor,
  validateDemManifest,
  validateManifest,
} from "./manifest";
import { SITE_DEM_CATALOG } from "../terrain/demCatalog";

const TEX = join(__dirname, "..", "..", "assets", "tex");
const DEM = join(__dirname, "..", "..", "assets", "terrain", "dem");
const LAYER_FILES: Record<string, string> = {
  "venus:clouds": "venus_clouds.jpg",
  "earth:clouds": "earth_clouds.jpg",
  "earth:night": "earth_night.jpg",
};

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
        : join(TEX, LAYER_FILES[`${m.body}:${m.view}`] ?? (m.body === "sun" ? "sun.jpg" : `${m.body}.jpg`));
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

describe("site DEM manifest (Phase 9)", () => {
  const WANT = ["apollo-12", "apollo-14", "apollo-15", "apollo-16", "apollo-17",
    "sojourner", "spirit", "opportunity", "insight"];

  it("validates with zero provenance problems", () => {
    expect(validateDemManifest(SITE_DEM_MANIFEST)).toEqual([]);
  });

  it("covers exactly the 9 mission sites with the right worlds", () => {
    expect(SITE_DEM_MANIFEST.map((m) => m.artifactId)).toEqual(WANT);
    for (const m of SITE_DEM_MANIFEST) {
      const moon = m.artifactId.startsWith("apollo");
      expect(m.world, m.id).toBe(moon ? "moon" : "mars");
      expect(m.sourceUrl.startsWith("https://"), m.id).toBe(true);
    }
  });

  it("generated catalog agrees with the manifest (one row per record)", () => {
    expect(SITE_DEM_CATALOG.length).toBe(SITE_DEM_MANIFEST.length);
    for (const c of SITE_DEM_CATALOG) {
      const m = SITE_DEM_MANIFEST.find((r) => r.artifactId === c.artifactId);
      expect(m, c.artifactId).toBeDefined();
      expect(m!.file).toBe(c.file);
      expect(m!.deliveredPx).toEqual([c.grid, c.grid]);
      expect(m!.nativeGspM).toBeCloseTo(c.nativeGspM, 0);
      expect(m!.deliveredGspM).toBeCloseTo(c.deliveredGspM, 0);
      expect(m!.org).toBe(c.org);
    }
  });

  it("delivered patches exist on disk, are valid 16-bit grayscale PNGs, non-trivial", () => {
    for (const m of SITE_DEM_MANIFEST) {
      const p = join(DEM, m.file);
      expect(existsSync(p), p).toBe(true);
      expect(statSync(p).size).toBeGreaterThan(8_000);
      const b = readFileSync(p);
      // PNG signature + IHDR: bit depth 16 (b24), color type 0 grayscale (b25), no interlace (b28)
      expect([...b.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect(b[24]).toBe(16);
      expect(b[25]).toBe(0);
      expect(b[28]).toBe(0);
    }
  });

  it("resample factor within the declared ~4x bilinear upsample bound", () => {
    for (const m of SITE_DEM_MANIFEST) {
      const f = m.nativeGspM / m.deliveredGspM;
      expect(f, m.id).toBeGreaterThanOrEqual(1);
      expect(f, m.id).toBeLessThanOrEqual(4.005);
    }
  });

  it("catches bad records (validator is not a rubber stamp)", () => {
    const bad = [
      { ...SITE_DEM_MANIFEST[0], sourceUrl: "http://x" } as never,
      { ...SITE_DEM_MANIFEST[0], deliveredGspM: 10 } as never,
    ];
    expect(validateDemManifest(bad as never).length).toBe(2);
  });
});
