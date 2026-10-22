import { describe, expect, it } from "vitest";
import {
  GAL_POLE_DEC_DEG,
  GAL_POLE_RA_DEG,
  createGalacticSkyGeometry,
  galToEq,
  galToSceneDir,
  skyLongitudeAt,
} from "@/engine/world/galactic";
import { starDirection } from "@/engine/world/starsData";

describe("galactic frame (IAU J2000) for the ESO panorama", () => {
  it("galactic center lands on the published IAU direction", () => {
    const [ra, dec] = galToEq(0, 0);
    expect(ra).toBeCloseTo(266.4051, 2);
    expect(dec).toBeCloseTo(-28.9362, 2);
  });

  it("north galactic pole matches the J2000 rotation constants", () => {
    const [ra, dec] = galToEq(123, 90);
    expect(ra).toBeCloseTo(GAL_POLE_RA_DEG, 3);
    expect(dec).toBeCloseTo(GAL_POLE_DEC_DEG, 3);
  });

  it("Large Magellanic Cloud maps to its real equatorial position", () => {
    const [ra, dec] = galToEq(280.4652, -32.8884);
    expect(ra).toBeCloseTo(80.8941, 1);
    expect(dec).toBeCloseTo(-69.7561, 1);
  });

  it("scene directions stay unit-length and agree with the star pipeline", () => {
    const out: [number, number, number] = [0, 0, 0];
    galToSceneDir(120, 15, out);
    expect(Math.hypot(out[0], out[1], out[2])).toBeCloseTo(1, 6);
    const [ra, dec] = galToEq(120, 15);
    const ref: [number, number, number] = [0, 0, 0];
    starDirection(ra, dec, ref);
    expect(out[0]).toBeCloseTo(ref[0], 6);
    expect(out[1]).toBeCloseTo(ref[1], 6);
    expect(out[2]).toBeCloseTo(ref[2], 6);
  });

  it("sky columns sweep the full 360 deg with the bulge centered", () => {
    expect(skyLongitudeAt(0)).toBe(-180);
    // mirrored scroll: u=0.5 lands on l=-360 (same meridian as the bulge at l=0)
    expect(((skyLongitudeAt(0.5) % 360) + 360) % 360).toBe(0);
    // u=1 reaches -540 deg, the same meridian as +180 (seam)
    expect(((skyLongitudeAt(1) % 360) + 360) % 360).toBe(180);
  });
});

describe("galactic sky-dome geometry", () => {
  const w = 32;
  const h = 16;
  const geo = createGalacticSkyGeometry(w, h);
  const pos = geo.getAttribute("position") as import("three").BufferAttribute;
  const uv = geo.getAttribute("uv") as import("three").BufferAttribute;
  const dir: [number, number, number] = [0, 0, 0];
  const bulge: [number, number, number] = [0, 0, 0];

  it("is a closed unit sphere with the expected vertex budget", () => {
    expect(pos.count).toBe((w + 1) * (h + 1));
    for (let i = 0; i < pos.count; i += 41) {
      expect(Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i))).toBeCloseTo(1, 5);
    }
    expect(geo.index?.count).toBe(w * h * 6);
  });

  it("row endpoints coincide across the 360-deg seam", () => {
    for (let j = 0; j <= h; j++) {
      const a = j * (w + 1);
      const b = a + w;
      expect(pos.getX(a)).toBeCloseTo(pos.getX(b), 5);
      expect(pos.getY(a)).toBeCloseTo(pos.getY(b), 5);
      expect(pos.getZ(a)).toBeCloseTo(pos.getZ(b), 5);
      expect(uv.getX(a)).toBe(0);
      expect(uv.getX(b)).toBe(1);
    }
  });

  it("puts the galactic bulge at the texture center, matching the panorama framing", () => {
    const i = (h / 2) * (w + 1) + w / 2;
    galToSceneDir(0, 0, bulge);
    expect(pos.getX(i)).toBeCloseTo(bulge[0], 5);
    expect(pos.getY(i)).toBeCloseTo(bulge[1], 5);
    expect(pos.getZ(i)).toBeCloseTo(bulge[2], 5);
    expect(uv.getX(i)).toBeCloseTo(0.5, 5);
    expect(uv.getY(i)).toBeCloseTo(0.5, 5);
    expect(uv.getY(0)).toBe(1); // image top = galactic north
    expect(uv.getY(pos.count - 1)).toBe(0);
  });

  it("a quarter turn from the bulge follows the panorama's scroll direction", () => {
    const u = 0.75;
    const i = (h / 2) * (w + 1) + u * w;
    galToSceneDir(skyLongitudeAt(u), 0, dir);
    expect(pos.getX(i)).toBeCloseTo(dir[0], 4);
    expect(pos.getY(i)).toBeCloseTo(dir[1], 4);
    expect(pos.getZ(i)).toBeCloseTo(dir[2], 4);
  });
});
