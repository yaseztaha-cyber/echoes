import * as THREE from "three";
import {
  BODIES,
  bodyById,
  bodyPos,
  realPos,
  realDistanceKm,
  ORBIT_K,
  MOON_VISUAL_ORBIT,
  voyagerAU,
  voyagerTrail,
  type Body,
} from "../solar-system/model";
import { VOYAGER_NOW } from "@/data/artifacts/voyager";
import { AU_KM, GLOBE_R, RADIUS_KM, localToLonLat, lonLatToVec, vecToLonLat } from "@/lib/geo";
import { hasKepler, keplerAU, keplerElementsAt, keplerOrbitPathAU } from "./kepler";

/**
 * ECHOES hierarchical coordinate frames (Phase 2).
 *
 * Three layers, never mixed silently:
 *
 *   SCI      Authoritative scientific coordinates. Heliocentric positions in AU
 *            (Keplerian JPL approximate elements, 1800–2050, from `kepler.ts`;
 *            Moon and Pluto keep documented approximations), body-fixed
 *            surface vectors in kilometres. Used for measurements, distances, telemetry.
 *   PRESENT  Navigation/presentation coordinates. The sqrt(AU) visual compression
 *            (`ORBIT_K * sqrt(r)`, applied per position) plus exaggerated body
 *            radii. Used ONLY for rendering and camera work. NEVER for measurements.
 *   RENDER   Camera-relative scene units for GPU stability (`FloatingOrigin`).
 *            Currently identical to PRESENT shifted by the origin; the machinery exists
 *            so future tile streaming can rebase without touching world logic.
 *
 * Conventions: three.js right-handed Y-up everywhere. The ecliptic is the XZ plane;
 * heliocentric longitude L grows toward -Z (x = r·cosL, z = −r·sinL). Surface frames
 * are body-fixed: +Y north pole, lon 0° at +X, east-positive (`lonLatToVec`).
 */

// ---------------------------------------------------------------------------
// Single authoritative access point. The orbital mechanics stay implemented in
// `model.ts`; this module is where the rest of the app must import them from.
// ---------------------------------------------------------------------------
export {
  BODIES,
  bodyById,
  bodyPos,
  realPos,
  realDistanceKm,
  ORBIT_K,
  MOON_VISUAL_ORBIT,
  voyagerAU,
  voyagerTrail,
  localToLonLat,
  vecToLonLat,
  hasKepler,
  keplerAU,
  keplerElementsAt,
  keplerOrbitPathAU,
};
export type { Body };

// ---------------------------------------------------------------------------
// SCI layer — physical units. Aliases with frame-explicit names.
// ---------------------------------------------------------------------------
/** Heliocentric position in AU (SCI frame). Same model/limitations as `realPos`. */
export const sciBodyPosAU = realPos;
/** Physical distance in kilometres (SCI frame). */
export const sciDistanceKm = realDistanceKm;

/** Body-fixed surface point in kilometres (SCI body frame). */
export function surfacePointKm(
  world: keyof typeof RADIUS_KM,
  lonDeg: number,
  latDeg: number,
  out = new THREE.Vector3()
): THREE.Vector3 {
  return lonLatToVec(lonDeg, latDeg, RADIUS_KM[world], out);
}

// ---------------------------------------------------------------------------
// PRESENT layer — visual navigation coordinates (scene units).
// ---------------------------------------------------------------------------
/** Visual body position (PRESENT frame). Same math as `bodyPos`, frame-explicit name. */
export const presentBodyPos = bodyPos;

/** Surface point on the presentation globe of radius GLOBE_R (PRESENT body frame). */
export function surfacePointGlobe(
  world: keyof typeof RADIUS_KM,
  lonDeg: number,
  latDeg: number,
  out = new THREE.Vector3()
): THREE.Vector3 {
  void world;
  return lonLatToVec(lonDeg, latDeg, GLOBE_R, out);
}

/** PRESENT globe vector → SCI body-fixed kilometres. Exact (uniform scale). */
export function globePointToKm(
  world: keyof typeof RADIUS_KM,
  v: THREE.Vector3,
  out = new THREE.Vector3()
): THREE.Vector3 {
  return out.copy(v).multiplyScalar(RADIUS_KM[world] / GLOBE_R);
}

/** SCI body-fixed kilometres → PRESENT globe vector. Exact (uniform scale). */
export function kmPointToGlobe(
  world: keyof typeof RADIUS_KM,
  v: THREE.Vector3,
  out = new THREE.Vector3()
): THREE.Vector3 {
  return out.copy(v).multiplyScalar(GLOBE_R / RADIUS_KM[world]);
}

/**
 * Invert the PRESENT radial mapping back to heliocentric AU (r = ORBIT_K·sqrt(a)).
 * Exact for planets by construction, at any true Keplerian radius.
 * Documented approximations: the Moon rides with Earth (visual lunar orbit is not
 * physical — returns Earth's semi-major axis); Voyager returns its AU model value.
 */
export function presentRadiusToAU(id: string, r: number, t: number): number {
  if (id === "sun") return 0;
  if (id === "voyager1") return voyagerAU(Math.min(t, VOYAGER_NOW));
  const b = bodyById(id);
  if (!b) throw new Error(`presentRadiusToAU: unknown body '${id}'`);
  if (b.parent) return bodyById(b.parent)?.a ?? 1;
  if (b.a <= 0) throw new Error(`presentRadiusToAU: body '${id}' has no orbit`);
  return (r / ORBIT_K) ** 2;
}

/** PRESENT radial mapping forward: AU → visual scene units. */
export function sciAUToPresentRadius(au: number): number {
  return ORBIT_K * Math.sqrt(Math.max(0, au));
}

// ---------------------------------------------------------------------------
// RENDER layer — camera-relative coordinates + floating origin.
// ---------------------------------------------------------------------------
export interface Positioned {
  position: THREE.Vector3;
}

/**
 * Floating origin for GPU stability. World logic (PRESENT frame) always lives in
 * `origin`-relative world coordinates; renderables are shifted by `-origin` so the
 * GPU never sees large magnitudes. Rebasing moves registered nodes AND the camera
 * by the same delta, so the view is bit-identical after the shift.
 *
 * At current scene magnitudes (solar view ~110 units, Voyager trail ~260) float32
 * is exact to ~1e-5 units — no measurable jitter, so the render loop does NOT rebase
 * yet. This class exists tested and ready for Phase 5 tile streaming, where local
 * detail frames will need it.
 */
export class FloatingOrigin {
  /** PRESENT-frame coordinates of the render origin. */
  readonly origin = new THREE.Vector3();

  toRender(world: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
    return out.copy(world).sub(this.origin);
  }

  toWorld(render: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
    return out.copy(render).add(this.origin);
  }

  /**
   * Shift the origin; every registered node (scene groups AND camera position AND
   * controls target — pass `{ position: controls.target }`) moves by -delta.
   * Returns the applied delta. World relationships are preserved exactly.
   */
  rebase(newOrigin: THREE.Vector3, nodes: Positioned[]): THREE.Vector3 {
    const delta = newOrigin.clone().sub(this.origin);
    for (const n of nodes) n.position.sub(delta);
    this.origin.copy(newOrigin);
    return delta;
  }
}

export { AU_KM };
