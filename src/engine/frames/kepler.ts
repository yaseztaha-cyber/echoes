/**
 * Real Keplerian planetary positions (JPL "Approximate Positions of the
 * Planets", E.M. Standish Table 1 — elements + rates, mean ecliptic and
 * equinox of J2000, valid 1800 AD – 2050 AD). Replaces the circular
 * mean-longitude model for planet positions; the Moon keeps its documented
 * visual approximation and Pluto keeps its circular approximation (Standish
 * table intentionally excludes Pluto).
 *
 * Frame mapping: JPL outputs heliocentric ecliptic (X, Y, Z) AU. ECHOES scene
 * frames put the ecliptic in the XZ plane with heliocentric longitude growing
 * toward −Z, so: scene.x = X, scene.z = −Y, scene.y = Z (small out-of-plane).
 *
 * Verification: kepler.test.ts compares against JPL Horizons geometric
 * heliocentric vectors (DE441), fetched 2026-10-23 for Earth/Mars at
 * 2004-01-25 and Jupiter at 2026-10-23. Tolerances follow the JPL accuracy
 * table (Earth λ err 20″ ≈ 2e-4 AU; Jupiter λ err 400″ ≈ 1e-2 AU).
 *
 * Reference: https://ssd.jpl.nasa.gov/planets/approx_pos.html (Standish &
 * Williams 1992 formulas as published by JPL SSD).
 */
import { D2R } from "@/lib/geo";
import { DAY_MS } from "@/lib/time";

/** Unix ms → Julian date (TDB≈UTC; 69 s offset is 8e-7 century — ignored). */
export function julianDate(t: number): number {
  return t / DAY_MS + 2440587.5;
}

interface Elem {
  a: number; da: number; // AU, AU/century
  e: number; de: number; // rad, rad/century
  I: number; dI: number; // deg, deg/century
  L: number; dL: number; // deg, deg/century
  lp: number; dlp: number; // longitude of perihelion, deg/century
  ln: number; dln: number; // longitude of ascending node, deg/century
}

// JPL Table 1 (valid 1800 AD - 2050 AD)
const ELEMENTS: Record<string, Elem> = {
  mercury: { a: 0.38709927, da: 0.00000037, e: 0.20563593, de: 0.00001906, I: 7.00497902, dI: -0.00594749, L: 252.25032350, dL: 149472.67411175, lp: 77.45779628, dlp: 0.16047689, ln: 48.33076593, dln: -0.12534081 },
  venus: { a: 0.72333566, da: 0.00000390, e: 0.00677672, de: -0.00004107, I: 3.39467605, dI: -0.00078890, L: 181.97909950, dL: 58517.81538729, lp: 131.60246718, dlp: 0.00268329, ln: 76.67984255, dln: -0.27769418 },
  earth: { a: 1.00000261, da: 0.00000562, e: 0.01671123, de: -0.00004392, I: -0.00001531, dI: -0.01294668, L: 100.46457166, dL: 35999.37244981, lp: 102.93768193, dlp: 0.32327364, ln: 0.0, dln: 0.0 },
  mars: { a: 1.52371034, da: 0.00001847, e: 0.09339410, de: 0.00007882, I: 1.84969142, dI: -0.00813131, L: -4.55343205, dL: 19140.30268499, lp: -23.94362959, dlp: 0.44441088, ln: 49.55953891, dln: -0.29257343 },
  jupiter: { a: 5.20288700, da: -0.00011607, e: 0.04838624, de: -0.00013253, I: 1.30439695, dI: -0.00183714, L: 34.39644051, dL: 3034.74612775, lp: 14.72847983, dlp: 0.21252668, ln: 100.47390909, dln: 0.20469106 },
  saturn: { a: 9.53667594, da: -0.00125060, e: 0.05386179, de: -0.00050991, I: 2.48599187, dI: 0.00193609, L: 49.95424423, dL: 1222.49362201, lp: 92.59887831, dlp: -0.41897216, ln: 113.66242448, dln: -0.28867794 },
  uranus: { a: 19.18916464, da: -0.00196176, e: 0.04725744, de: -0.00004397, I: 0.77263783, dI: -0.00242939, L: 313.23810451, dL: 428.48202785, lp: 170.95427630, dlp: 0.40805281, ln: 74.01692503, dln: 0.04240589 },
  neptune: { a: 30.06992276, da: 0.00026291, e: 0.00859048, de: 0.00005105, I: 1.77004347, dI: 0.00035372, L: -55.12002969, dL: 218.45945325, lp: 44.96476227, dlp: -0.32241464, ln: 131.78422574, dln: -0.00508664 },
};

export const keplerBodies = Object.keys(ELEMENTS);
export const hasKepler = (id: string) => id in ELEMENTS;

export interface KeplerState {
  /** Instantaneous heliocentric AU radius. */
  r: number;
  /** Instantaneous speed along the orbit (AU/day, vis-viva). */
  v: number;
}

const K_EPHE = 2451545.0;
const CY_DAYS = 36525;

/** Kepler's equation E − e·sinE = M (radians), Newton, tol 1e-8 rad. */
function eccentricAnomaly(Mrad: number, e: number): number {
  const TAU = Math.PI * 2;
  const M = ((Mrad + Math.PI) % TAU + TAU) % TAU - Math.PI; // wrap to [−π, π]
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 12; i++) {
    const dM = M - (E - e * Math.sin(E));
    const dE = dM / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) <= 1e-8) break;
  }
  return E;
}

/** Solve elements at time t and return them (also used for orbit-path sweeps). */
export function keplerElementsAt(id: string, t: number): { a: number; e: number; I: number; w: number; Om: number; M: number } {
  const el = ELEMENTS[id];
  if (!el) throw new Error(`kepler: unknown body '${id}'`);
  const T = (julianDate(t) - K_EPHE) / CY_DAYS;
  const a = el.a + el.da * T;
  const e = Math.max(0, el.e + el.de * T);
  const I = (el.I + el.dI * T) * D2R;
  const lp = (el.lp + el.dlp * T) * D2R;
  const Om = (el.ln + el.dln * T) * D2R;
  const w = lp - Om;
  const M = (el.L + el.dL * T - (el.lp + el.dlp * T)) * D2R;
  return { a, e, I, w, Om, M };
}

/**
 * Heliocentric position in AU, ECHOES scene convention (ecliptic = XZ plane,
 * longitude toward −Z, scene.y = ecliptic Z).
 * Callers may pass a precomputed element state for path sweeps.
 */
export function keplerAU(id: string, t: number, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  const st = keplerElementsAt(id, t);
  return keplerFromState(st, out);
}

export function keplerFromState(
  st: { a: number; e: number; I: number; w: number; Om: number; M: number },
  out: [number, number, number] = [0, 0, 0]
): [number, number, number] {
  const E = eccentricAnomaly(st.M, st.e);
  const cp = Math.cos(st.w);
  const sp = Math.sin(st.w);
  const cn = Math.cos(st.Om);
  const sn = Math.sin(st.Om);
  const ci = Math.cos(st.I);
  const si = Math.sin(st.I);
  const xp = st.a * (Math.cos(E) - st.e);
  const yp = st.a * Math.sqrt(1 - st.e * st.e) * Math.sin(E);
  const xEcl = (cp * cn - sp * sn * ci) * xp + (-sp * cn - cp * sn * ci) * yp;
  const yEcl = (cp * sn + sp * cn * ci) * xp + (-sp * sn + cp * cn * ci) * yp;
  const zEcl = sp * si * xp + cp * si * yp;
  out[0] = xEcl;
  out[1] = zEcl; // scene Y = ecliptic north
  out[2] = -yEcl; // scene −Z = ecliptic +Y (longitude toward −Z)
  return out;
}

/** True 3D orbit path (AU, scene convention) for the ellipse line rendering. */
export function keplerOrbitPathAU(id: string, t: number, n = 256): [number, number, number][] {
  const st = keplerElementsAt(id, t);
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const E = ((i / n) * 360 - 180) * D2R;
    const cp = Math.cos(st.w);
    const sp = Math.sin(st.w);
    const cn = Math.cos(st.Om);
    const sn = Math.sin(st.Om);
    const ci = Math.cos(st.I);
    const si = Math.sin(st.I);
    const xp = st.a * (Math.cos(E) - st.e);
    const yp = st.a * Math.sqrt(1 - st.e * st.e) * Math.sin(E);
    const xEcl = (cp * cn - sp * sn * ci) * xp + (-sp * cn - cp * sn * ci) * yp;
    const yEcl = (cp * sn + sp * cn * ci) * xp + (-sp * sn + cp * cn * ci) * yp;
    const zEcl = sp * si * xp + cp * si * yp;
    pts.push([xEcl, zEcl, -yEcl]);
  }
  return pts;
}
