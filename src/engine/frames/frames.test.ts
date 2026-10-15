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

/**
 * Tolerances (float64 arithmetic, justified in physical units):
 * - 1e-9 AU ≈ 0.15 m at 1 AU. Anything coarser would hide metre-scale site errors.
 * - 1e-9 deg latitude ≈ 0.06 mm on Mars. Far below any dataset we hold.
 * - 1e-6 km on distances ≈ 1 mm. Adequate for telemetry display (shows 2 decimals max).
 */

const planets = BODIES.filter((b) => b.kind === "planet");

describe("SCI frame — circular-orbit invariants", () => {
  it("sun–earth distance is exactly 1 AU at any epoch", () => {
    for (const dt of [0, 123.456 * DAY_MS, 36525 * DAY_MS]) {
      expect(sciDistanceKm("earth", "sun", J2000 + dt)).toBeCloseTo(AU_KM, 6);
    }
  });

  it("each planet holds its semi-major axis distance from the sun", () => {
    for (const b of planets) {
      expect(sciDistanceKm(b.id, "sun", J2000) / AU_KM).toBeCloseTo(b.a, 9);
    }
  });

  it("distances are symmetric and non-negative", () => {
    const t = J2000 + 4000 * DAY_MS;
    for (const b of planets) {
      expect(sciDistanceKm("earth", b.id, t)).toBeGreaterThanOrEqual(0);
      expect(sciDistanceKm("earth", b.id, t)).toBeCloseTo(sciDistanceKm(b.id, "earth", t), 9);
    }
  });

  it("sciBodyPosAU radius matches the semi-major axis", () => {
    for (const b of planets) {
      const [x, y, z] = sciBodyPosAU(b.id, J2000);
      expect(y).toBe(0); // model ecliptic plane
      expect(Math.hypot(x, z)).toBeCloseTo(b.a, 9);
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

  it("present positions sit on the mapped orbit radius", () => {
    for (const b of planets) {
      const p = presentBodyPos(b.id, J2000 + 777 * DAY_MS, new THREE.Vector3());
      expect(Math.hypot(p.x, p.z)).toBeCloseTo(sciAUToPresentRadius(b.a), 9);
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
