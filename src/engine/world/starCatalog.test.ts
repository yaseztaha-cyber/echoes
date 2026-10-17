import { describe, expect, it } from "vitest";
import { STAR_COUNT, STAR_MAG_MAX } from "@/data/stars/starCatalog";
import {
  buildStarGeometryData,
  colorIndexToKelvin,
  decodeStars,
  kelvinToRgb,
  starBrightness,
  starDirection,
} from "@/engine/world/starsData";

describe("star catalogue (HYG v4.4 excerpt)", () => {
  const data = decodeStars();

  it("decodes the base64 head into the documented record count", () => {
    expect(data.length).toBe(STAR_COUNT * 4);
    expect(STAR_COUNT).toBeGreaterThanOrEqual(4500);
    expect(STAR_COUNT).toBeLessThanOrEqual(7000);
  });

  it("fields lie in astronomical ranges (RA deg, DEC deg, Vmag, B-V)", () => {
    for (let i = 0; i < STAR_COUNT; i += 97) {
      const o = i * 4;
      const [ra, dec, mag, ci] = [data[o], data[o + 1], data[o + 2], data[o + 3]];
      expect(ra).toBeGreaterThanOrEqual(0);
      expect(ra).toBeLessThan(360);
      expect(dec).toBeGreaterThanOrEqual(-90);
      expect(dec).toBeLessThanOrEqual(90);
      expect(mag).toBeGreaterThan(-2);
      expect(mag).toBeLessThanOrEqual(STAR_MAG_MAX);
      expect(ci).toBeGreaterThanOrEqual(-0.4);
      expect(ci).toBeLessThanOrEqual(2.2);
    }
  });

  it("contains Sirius-level bright stars at the top of the sorted list", () => {
    expect(data[2]).toBeGreaterThan(-1.6);
    expect(data[2]).toBeLessThan(-1.2);
  });

  it("polaris is on the catalogue near its J2000 position (02h31m, +89.26)", () => {
    for (let i = 0; i < STAR_COUNT; i++) {
      const o = i * 4;
      const ra = data[o], dec = data[o + 1], mag = data[o + 2];
      if (dec > 89 && mag < 2.6) {
        const near = Math.min(Math.abs(ra - 37.95), 360 - Math.abs(ra - 37.95));
        expect(near, `polaris match at ra=${ra} dec=${dec} mag=${mag}`).toBeLessThan(2);
        return;
      }
    }
    throw new Error("no bright circumpolar star found - catalogue suspect");
  });

  it("is sky-structured: Milky Way band (|galactic lat|<15) is overrepresented vs uniform 25.9%", () => {
    const eqToGalSinB = (raDeg: number, decDeg: number) => {
      // Galactic pole J2000: RA 192.85948 deg, Dec 27.12825 deg.
      const ra = (raDeg * Math.PI) / 180;
      const dec = (decDeg * Math.PI) / 180;
      const rp = (192.85948 * Math.PI) / 180;
      const dp = (27.12825 * Math.PI) / 180;
      return Math.sin(dec) * Math.sin(dp) + Math.cos(dec) * Math.cos(dp) * Math.cos(ra - rp);
    };
    const step = Math.floor(STAR_COUNT / 12);
    const band: number[] = [];
    const high: number[] = [];
    for (let s = 0; s < 12; s++) {
      let b = 0;
      let h = 0;
      for (let i = s * step; i < Math.min((s + 1) * step, STAR_COUNT); i++) {
        const ra = data[i * 4];
        const dec = data[i * 4 + 1];
        const sinb = eqToGalSinB(ra, dec);
        if (Math.abs(sinb) < Math.sin((15 * Math.PI) / 180)) b++;
        else if (Math.abs(sinb) > Math.sin((45 * Math.PI) / 180)) h++;
      }
      band.push(b / step);
      high.push(h / step);
    }
    const bandAvg = band.reduce((a, c) => a + c, 0) / band.length;
    const highAvg = high.reduce((a, c) => a + c, 0) / high.length;
    // Band area fraction = 4*PI*sin(15deg)/4*PI = 0.2588; uniform field would land near it.
    expect(bandAvg).toBeGreaterThan(0.32);
    expect(highAvg).toBeLessThan(0.42);
  });

  it("is sorted brightest-first so callers can cap with a lower count", () => {
    for (let i = 1; i < STAR_COUNT; i += 211) {
      expect(data[i * 4 + 2]).toBeGreaterThanOrEqual(data[(i - 1) * 4 + 2] - 1e-6);
    }
  });
});

describe("star property mapping", () => {
  it("magnitude -> brightness preserves ordering and compresses range", () => {
    expect(starBrightness(-1.44)).toBeGreaterThan(starBrightness(0));
    expect(starBrightness(0)).toBeGreaterThan(starBrightness(6));
    expect(starBrightness(-1.44)).toBeGreaterThan(1.4);
    expect(starBrightness(6)).toBeGreaterThanOrEqual(0.13);
  });

  it("color index -> kelvin stays in the O..M spectral band", () => {
    expect(colorIndexToKelvin(-0.33)).toBeGreaterThan(14000);
    // Ballesteros anchor: B-V = 0 -> ~10,125 K (A0 zero point), B-V = 0.656 -> ~5,778 K (Sun).
    expect(colorIndexToKelvin(0)).toBeGreaterThan(9500);
    expect(colorIndexToKelvin(0.656)).toBeGreaterThan(5500);
    expect(colorIndexToKelvin(0.656)).toBeLessThan(6100);
    expect(colorIndexToKelvin(1.5)).toBeLessThan(4200);
  });

  it("kelvin -> rgb keeps hot stars bluish and cool stars warm", () => {
    const [hotR, , hotB] = kelvinToRgb(20000);
    const [coolR, , coolB] = kelvinToRgb(3000);
    expect(hotB).toBeGreaterThan(hotR);
    expect(coolR).toBeGreaterThan(coolB);
  });

  it("directions are unit-length in the scene frame", () => {
    const out: [number, number, number] = [0, 0, 0];
    const { positions } = buildStarGeometryData(200);
    for (let i = 0; i < 200; i++) {
      starDirection(positions[i * 3], positions[i * 3 + 1], out);
      expect(Math.hypot(out[0], out[1], out[2])).toBeCloseTo(1, 5);
    }
    const len = Math.hypot(positions[0], positions[1], positions[2]);
    expect(len).toBeCloseTo(1, 5);
  });

  it("built data caps count and sizes stay small (px budget)", () => {
    const { positions, sizes } = buildStarGeometryData(100);
    expect(positions.length).toBe(300);
    expect(sizes[0]).toBeGreaterThan(3.5);
    for (const s of sizes) expect(s).toBeLessThanOrEqual(3.9);
  });
});
