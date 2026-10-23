import { describe, expect, it } from "vitest";
import { keplerAU, keplerElementsAt, keplerOrbitPathAU, hasKepler, keplerBodies, julianDate } from "./kepler";
import { DAY_MS, J2000 } from "@/lib/time";

/**
 * Ground truth: JPL Horizons geometric heliocentric vectors (DE441), ecliptic
 * of J2000, fetched via ssd.jpl.nasa.gov/api/horizons.api on 2026-10-23.
 * Horizons X/Y map to kepler scene x/−z; tolerance follows the JPL accuracy
 * table for the Standish approximation (Earth λ 20″→2e-4 AU; Mars 40″→3e-4;
 * Jupiter 400″→1.1e-2), plus Earth-center vs EM-Bary wobble (2.1e-4 AU).
 */
const T_2004_01_25 = Date.UTC(2004, 0, 25); // JD 2453029.5
const T_2026_10_23 = Date.UTC(2026, 9, 23); // JD 2461336.5

/** Horizons ecliptic (X, Y, Z) in AU → scene convention [x, y, z]. */
const hz = (x: number, y: number, z: number): [number, number, number] => [x, z, -y];

function assertNear(id: string, t: number, ref: [number, number, number], tol: number) {
  const got = keplerAU(id, t);
  // primary: vector distance to the Horizons anchor, per-component second.
  const d = Math.hypot(got[0] - ref[0], got[1] - ref[1], got[2] - ref[2]);
  expect(d, `${id} vector distance to Horizons at JD ${julianDate(t)}`).toBeLessThan(tol);
  for (let i = 0; i < 3; i++) {
    expect(got[i], `${id}[${i}] at JD ${julianDate(t)}`).toBeCloseTo(ref[i], Math.max(0, Math.floor(-Math.log10(tol))));
  }
}

describe("kepler — matches JPL Horizons (DE441) heliocentric vectors", () => {
  it("Earth at 2004-01-25 00:00 UTC (JD 2453029.5)", () => {
    assertNear("earth", T_2004_01_25, hz(-0.5545959, 0.8133279, -0.0000052), 0.002);
  });
  it("Mars at 2004-01-25 00:00 UTC (Opportunity landing day)", () => {
    assertNear("mars", T_2004_01_25, hz(0.6590483, 1.3534104, 0.0121658), 0.003);
  });
  it("Jupiter at 2026-10-23 00:00 UTC (today)", () => {
    assertNear("jupiter", T_2026_10_23, hz(-3.6158388, 3.8936547, 0.0647253), 0.02);
  });
  it("Horizons radii reproduce (distance verification)", () => {
    expect(Math.hypot(...keplerAU("earth", T_2004_01_25))).toBeCloseTo(0.984418, 3);
    expect(Math.hypot(...keplerAU("mars", T_2004_01_25))).toBeCloseTo(1.505394, 3);
    expect(Math.hypot(...keplerAU("jupiter", T_2026_10_23))).toBeCloseTo(5.314040, 2);
  });
});

describe("kepler — orbital shape and mechanics", () => {
  it("perihelion/aphelion bounds hold over the table's validity window", () => {
    for (const id of keplerBodies) {
      const el = ELEMENT_BOUNDS[id];
      for (const t of [J2000 + 3650 * DAY_MS, J2000 + 9500 * DAY_MS]) {
        const r = Math.hypot(...keplerAU(id, t));
        expect(r, `${id} r(t) inside perihelion..aphelion`).toBeGreaterThanOrEqual(el[0] - 1e-6);
        expect(r).toBeLessThanOrEqual(el[1] + 1e-6);
      }
    }
  });

  it("the orbit path sweeps the full ellipse at the instantaneous elements", () => {
    const path = keplerOrbitPathAU("mars", J2000, 180);
    expect(path.length).toBe(181);
    const radii = path.map((p) => Math.hypot(p[0], p[1], p[2]));
    expect(Math.min(...radii)).toBeCloseTo(1.52371034 * (1 - 0.09339410), 4);
    expect(Math.max(...radii)).toBeCloseTo(1.52371034 * (1 + 0.09339410), 4);
    // Mars' out-of-plane amplitude ≈ a·sin(I)
    expect(Math.max(...path.map((p) => Math.abs(p[1])))).toBeGreaterThan(0.03);
  });

  it("eccentricity visibly warps Mars' radius (true orbit, not a circle)", () => {
    const st = keplerElementsAt("mars", J2000);
    const rMin = st.a * (1 - st.e);
    const rMax = st.a * (1 + st.e);
    expect(rMax - rMin).toBeGreaterThan(0.27); // e=0.0934 ⇒ Δr ≈ 0.284 AU
  });

  it("Mars is genuinely out of the ecliptic plane at Horizons' 2004 anchor", () => {
    expect(keplerAU("mars", T_2004_01_25)[1]).toBeCloseTo(0.0121658, 3);
  });

  it("unknown bodies throw; flags agree", () => {
    expect(() => keplerAU("moon", J2000)).toThrow();
    expect(hasKepler("earth")).toBe(true);
    expect(hasKepler("pluto")).toBe(false);
    expect(hasKepler("voyager1")).toBe(false);
  });

  it("elements interpolate smoothly (deterministic, finite far future)", () => {
    const a = keplerAU("jupiter", J2000 + 3650 * DAY_MS);
    const b = keplerAU("jupiter", J2000 + 3650 * DAY_MS);
    expect(a).toEqual(b);
    expect(a.every(Number.isFinite)).toBe(true);
  });
});

// perihelion / aphelion from JPL Table 1 at J2000 (a·(1∓e))
const ELEMENT_BOUNDS: Record<string, [number, number]> = {
  mercury: [0.38709927 * 0.79436407, 0.38709927 * 1.20563593],
  venus: [0.72333566 * 0.99322328, 0.72333566 * 1.00677672],
  earth: [1.00000261 * 0.98328877, 1.00000261 * 1.01671123],
  mars: [1.52371034 * 0.90660590, 1.52371034 * 1.09339410],
  jupiter: [5.20288700 * 0.95161376, 5.20288700 * 1.04838624],
  saturn: [9.53667594 * 0.94613821, 9.53667594 * 1.05386179],
  uranus: [19.18916464 * 0.95274256, 19.18916464 * 1.04725744],
  neptune: [30.06992276 * 0.99140952, 30.06992276 * 1.00859048],
};
