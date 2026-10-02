import * as THREE from "three";

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;
export const AU_KM = 149597870.7;
export const RADIUS_KM = { mars: 3389.5, moon: 1737.4, earth: 6371 } as const;
/** In planet scenes every globe has a radius of 100 scene units. */
export const GLOBE_R = 100;

export function lonLatToVec(lonDeg: number, latDeg: number, r = 1, out = new THREE.Vector3()) {
  const lo = lonDeg * D2R;
  const la = latDeg * D2R;
  return out.set(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)).multiplyScalar(r);
}

export function vecToLonLat(v: THREE.Vector3) {
  const l = v.length() || 1;
  return { lat: Math.asin(v.y / l) * R2D, lon: Math.atan2(-v.z, v.x) * R2D };
}

/** Convert metres east / south of a reference point to lat/lon (spherical body). */
export function localToLonLat(refLat: number, refLon: number, x: number, z: number, radiusKm: number) {
  const R = radiusKm * 1000;
  const lat = refLat - (z / R) * R2D;
  const lon = refLon + (x / (R * Math.cos(refLat * D2R))) * R2D;
  return { lat, lon };
}

export function fmtDist(m: number) {
  const a = Math.abs(m);
  if (a < 1000) return `${a.toFixed(a < 10 ? 1 : 0)} M`;
  if (a < 1e7) return `${(a / 1000).toFixed(a < 1e4 ? 2 : a < 1e5 ? 1 : 0)} KM`;
  const km = a / 1000;
  if (km < 1e6) return `${Math.round(km).toLocaleString("en-US")} KM`;
  if (km < 1.5e7) return `${(km / 1e6).toFixed(2)} M KM`;
  return `${(km / AU_KM).toFixed(2)} AU`;
}

export const fmtLat = (v: number) => `${Math.abs(v).toFixed(4)}°${v >= 0 ? "N" : "S"}`;
export const fmtLon = (v: number) => {
  const e = ((v % 360) + 360) % 360;
  return `${e.toFixed(4)}°E`;
};

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
