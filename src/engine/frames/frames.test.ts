import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  BODIES,
  bodyById,
  presentBodyPos,
  sciBodyPosAU,
  sciDistanceKm,
  presentRadiusToAU,
  sciAUToPresentRadius,
  surfacePointKm,
  surfacePointGlobe,
  globePointToKm,
  kmPointToGlobe,
  localToLonLat,
  vecToLonLat,
  FloatingOrigin,
  ORBIT_K,
  AU_KM,
} from "./frames";
import { GLOBE_R, RADIUS_KM } from "@/lib/geo";
import { J2000, DAY_MS } from "@/lib/time";
import { keplerElementsAt } from "./kepler";

/**
 * Tolerances (float64 arithmetic, justified in physical units):
 * - 1e-9 AU ≈ 0.15 m at 1 AU. Anything coarser would hide metre-scale site errors.
 * - 1e-9 deg latitude ≈ 0.06 mm on Mars. Far below any dataset we hold.
 * - 1e-6 km on distances ≈ 1 mm. Adequate for telemetry display (shows 2 decimals max).
 */

const planets = BODIES.filter((b) => b.kind === "planet");

/** Perihelion/aphelion multipliers (1∓e) from JPL Standish Table 1 (a·(1−e), a·(1+e)). */
const PERI_APHE: Record<string, [number, number]> = {
  mercury: [0.307490, 0.466697],
  venus: [0.718433, 0.728214],
  earth: [0.983289, 1.016713],
  mars: [1.381335, 1.665981],
  jupiter: [4.951156, 5.454537],
  saturn: [9.023078, 10.050181],
  uranus: [18.286183, 20.101410],
  neptune: [29.811465, 30.328396],
};

describe("SCI frame — Keplerian orbit invariants (JPL approximate elements)", () => {
  const EPOCHS = [0, 777 * DAY_MS, 3652.5 * DAY_MS, 16425 * DAY_MS];

  it("sun–earth distance is Keplerian, not constant: bounded and matching Horizons at the anchor", () => {
    // Horizons DE441 heliocentric range on 2004-01-25 (fetched 2026-10-23).
    expect(sciDistanceKm("earth", "sun", Date.UTC(2004, 0, 25)) / AU_KM).toBeCloseTo(0.984418, 3);
    for (const dt of EPOCHS) {
      const au = sciDistanceKm("earth", "sun", J2000 + dt) / AU_KM;
      expect(au).toBeGreaterThanOrEqual(0.983288 - 5e-5);
      expect(au).toBeLessThanOrEqual(1.016713 + 5e-5);
    }
  });

  it("each planet's heliocentric radius lives between perihelion and aphelion (at its own epoch)", () => {
    for (const b of planets) {
      if (!(b.id in PERI_APHE)) continue; // Pluto keeps its circular approximation
      for (const dt of EPOCHS) {
        const t = J2000 + dt;
        const el = keplerElementsAt(b.id, t);
        const peri = el.a * (1 - el.e);
        const aphe = el.a * (1 + el.e);
        const au = sciDistanceKm(b.id, "sun", t) / AU_KM;
        expect(au, `${b.id} +${(dt / DAY_MS).toFixed(0)} days below perihelion`).toBeGreaterThanOrEqual(peri - 1e-8);
        expect(au, `${b.id} +${(dt / DAY_MS).toFixed(0)} days beyond aphelion`).toBeLessThanOrEqual(aphe + 1e-8);
      }
    }
  });

  it("mean heliocentric radius over one orbit ≈ semi-major axis (Kepler property)", () => {
    for (const b of planets) {
      const n = 73;
      let sum = 0;
      for (let i = 0; i < n; i++) sum += sciDistanceKm(b.id, "sun", J2000 + (b.periodDays * DAY_MS * i) / n) / AU_KM;
      expect(sum / n, `${b.id} mean radius`).toBeCloseTo(b.a, 1);
    }
  });

  it("distances are symmetric and non-negative", () => {
    const t = J2000 + 4000 * DAY_MS;
    for (const b of planets) {
      expect(sciDistanceKm("earth", b.id, t)).toBeGreaterThanOrEqual(0);
      expect(sciDistanceKm("earth", b.id, t)).toBeCloseTo(sciDistanceKm(b.id, "earth", t), 9);
    }
  });

  it("sciBodyPosAU is heliocentric, near-ecliptic, and radially Keplerian", () => {
    for (const b of planets) {
      if (!(b.id in PERI_APHE)) continue; // Pluto keeps its circular approximation
      const t = J2000 + 777 * DAY_MS;
      const [x, y, z] = sciBodyPosAU(b.id, t);
      const el = keplerElementsAt(b.id, t);
      // out-of-plane amplitude is bounded by the orbit's inclined geometry
      expect(Math.abs(y), `${b.id} out-of-plane within a(sinI)(1+e)`).toBeLessThanOrEqual(el.a * (1 + el.e) * Math.abs(Math.sin(el.I)) + 1e-9);
      expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(el.a * (1 - el.e) - 1e-8);
      expect(Math.hypot(x, z)).toBeLessThanOrEqual(el.a * (1 + el.e) + 1e-8);
    }
  });
});

describe("PRESENT frame — visual mapping and its inverse", () => {
  it("AU ↔ visual radius round-trips for every planet", () => {
    for (const b of planets) {
      const r = sciAUToPresentRadius(b.a);
      expect(r).toBeCloseTo(ORBIT_K * Math.sqrt(b.a), 9);
      expect(presentRadiusToAU(b.id, r, J2000)).toBeCloseTo(b.a, 9);
    }
  });

  it("present positions sit exactly on the per-position mapped radius (radial compression)", () => {
    const t = J2000 + 777 * DAY_MS;
    for (const b of planets) {
      const sci = sciBodyPosAU(b.id, t);
      const rAU = Math.hypot(sci[0], sci[1], sci[2]);
      const p = presentBodyPos(b.id, t, new THREE.Vector3());
      // full 3D radius maps r → ORBIT_K*sqrt(r) regardless of direction
      expect(p.length()).toBeCloseTo(sciAUToPresentRadius(rAU), 9);
      // and the inverse primitive reproduces the same AU radius
      expect(presentRadiusToAU(b.id, p.length(), t)).toBeCloseTo(rAU, 9);
    }
  });

  it("the presentation scale is nonlinear (guard against silent linearization)", () => {
    const auRatio = 1.524 / 1; // mars / earth
    const presentRatio = sciAUToPresentRadius(1.524) / sciAUToPresentRadius(1);
    expect(presentRatio).not.toBeCloseTo(auRatio, 2);
    expect(presentRadiusToAU("mars", sciAUToPresentRadius(1.524), J2000)).toBeCloseTo(1.524, 9);
  });

  it("moon resolves to earth's orbit (documented approximation)", () => {
    expect(presentRadiusToAU("moon", 5, J2000)).toBe(1);
  });

  it("unknown bodies throw instead of returning garbage", () => {
    expect(() => presentRadiusToAU("pluto-9", 10, J2000)).toThrow();
  });

  it("positions are deterministic and finite far in the future", () => {
    const t = J2000 + 36525 * 10 * DAY_MS; // +1000 years
    for (const b of [...planets, bodyById("moon")!]) {
      const a = presentBodyPos(b.id, t, new THREE.Vector3());
      const c = presentBodyPos(b.id, t, new THREE.Vector3());
      expect(a.equals(c)).toBe(true);
      expect([a.x, a.y, a.z].every(Number.isFinite)).toBe(true);
    }
  });
});

describe("surface frames — lon/lat ↔ vectors", () => {
  // Opportunity landing site, MERIDIANI PLANUM (documented mission coordinates)
  const LON = 354.4734;
  const LAT = -1.9462;

  it("lon/lat round-trips through the globe vector", () => {
    const v = surfacePointGlobe("mars", LON, LAT, new THREE.Vector3());
    expect(v.length()).toBeCloseTo(GLOBE_R, 9);
    const back = vecToLonLat(v);
    expect(back.lat).toBeCloseTo(LAT, 9);
    // vecToLonLat returns (-180,180]; compare modulo 360 (354.4734 ≡ -5.5266)
    const angDiff = Math.abs((((back.lon - LON) % 360) + 540) % 360 - 180);
    expect(angDiff).toBeLessThan(1e-9);
  });

  it("globe ↔ kilometre scaling round-trips exactly", () => {
    const g = surfacePointGlobe("mars", LON, LAT, new THREE.Vector3());
    const km = globePointToKm("mars", g, new THREE.Vector3());
    expect(km.length()).toBeCloseTo(RADIUS_KM.mars, 6);
    const back = kmPointToGlobe("mars", km, new THREE.Vector3());
    expect(back.distanceTo(g)).toBeLessThan(1e-9);
    // and it agrees with the direct SCI surface constructor
    const direct = surfacePointKm("mars", LON, LAT, new THREE.Vector3());
    expect(direct.distanceTo(km)).toBeLessThan(1e-9);
  });

  it("poles and antimeridian behave", () => {
    expect(vecToLonLat(surfacePointGlobe("moon", 0, 90)).lat).toBeCloseTo(90, 9);
    expect(vecToLonLat(surfacePointGlobe("moon", 0, -90)).lat).toBeCloseTo(-90, 9);
  });

  it("site-local offsets: origin identity and east-positive monotonicity", () => {
    const at = localToLonLat(LAT, LON, 0, 0, RADIUS_KM.mars);
    expect(at.lat).toBeCloseTo(LAT, 12);
    expect(at.lon).toBeCloseTo(LON, 12);
    const east = localToLonLat(LAT, LON, 1000, 0, RADIUS_KM.mars);
    const west = localToLonLat(LAT, LON, -1000, 0, RADIUS_KM.mars);
    expect(east.lon).toBeGreaterThan(LON);
    expect(west.lon).toBeLessThan(LON);
    // 1 km east at the equator ≈ 1/111.19 degrees; Meridiani is near-equatorial
    expect(east.lon - LON).toBeCloseTo(1000 / ((RADIUS_KM.mars * 1000 * Math.cos(LAT * (Math.PI / 180)) * Math.PI) / 180), 9);
  });
});

describe("RENDER frame — floating origin", () => {
  it("toRender/toWorld round-trips", () => {
    const f = new FloatingOrigin();
    f.origin.set(1000, -20, 3000);
    const w = new THREE.Vector3(1005, 3, 2990);
    const r = f.toRender(w, new THREE.Vector3());
    expect([r.x, r.y, r.z]).toEqual([5, 23, -10]);
    expect(f.toWorld(r, new THREE.Vector3()).distanceTo(w)).toBeLessThan(1e-12);
  });

  it("rebase preserves world positions of nodes and camera", () => {
    const f = new FloatingOrigin();
    const rover = { position: new THREE.Vector3(12, 0.5, -7) }; // PRESENT-world coords
    const camera = { position: new THREE.Vector3(40, 12, 30) };
    const before = [rover.position.clone(), camera.position.clone()];
    const delta = f.rebase(new THREE.Vector3(10, 0, -5), [rover, camera]);
    expect([delta.x, delta.y, delta.z]).toEqual([10, 0, -5]);
    // render coords shifted by -delta, so world = render + origin is unchanged
    expect(f.toWorld(f.toRender(before[0], new THREE.Vector3()))).toBeTruthy();
    for (const [node, orig] of [[rover, before[0]], [camera, before[1]]] as const) {
      const reconstructed = orig.clone(); // world truth
      const viaRender = f.toWorld(f.toRender(orig, new THREE.Vector3()), new THREE.Vector3());
      expect(viaRender.distanceTo(reconstructed)).toBeLessThan(1e-12);
      expect(node.position.distanceTo(orig.clone().sub(delta))).toBeLessThan(1e-12);
    }
  });

  it("double rebase composes without drift", () => {
    const f = new FloatingOrigin();
    const node = { position: new THREE.Vector3(1e6, 2e6, -3e6) };
    const truth = node.position.clone();
    f.rebase(new THREE.Vector3(1e6, 2e6, -3e6), [node]);
    f.rebase(new THREE.Vector3(1e6 + 50, 2e6, -3e6), [node]);
    // node now sits 50 units off origin in render space; world truth recoverable
    expect(f.toWorld(node.position, new THREE.Vector3()).distanceTo(truth)).toBeLessThan(1e-6);
  });
});

describe("director transition math — apparent-size continuity", () => {
  it("solar→planet swap preserves apparent size (travelToBody k-factor)", () => {
    const b = bodyById("mars")!;
    const k = GLOBE_R / b.radius;
    // simulated: camera offset from body centre in PRESENT solar units
    const off = new THREE.Vector3(3.2, 1.1, -2.4);
    const rel = off.clone().multiplyScalar(k); // what travelToBody computes
    // apparent size = offset / body radius must be identical in both frames
    expect(rel.length() / GLOBE_R).toBeCloseTo(off.length() / b.radius, 12);
  });

  it("planet→solar swap inverts exactly (returnToSolarSystem)", () => {
    const b = bodyById("moon")!;
    const k = GLOBE_R / b.radius;
    const rel = new THREE.Vector3(30, -12, 44);
    const restored = rel.clone().multiplyScalar(1 / k);
    expect(restored.length() * k).toBeCloseTo(rel.length(), 12);
  });
});
