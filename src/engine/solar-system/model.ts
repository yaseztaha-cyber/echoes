import * as THREE from "three";
import { AU_KM, D2R } from "@/lib/geo";
import { DAY_MS, J2000, YEAR_MS } from "@/lib/time";
import { VOYAGER_LAUNCH, VOYAGER_NOW } from "@/data/artifacts/voyager";

/** Visual scale: scene radius = ORBIT_K * sqrt(AU). Adjusted for navigation, NOT to scale. */
export const ORBIT_K = 20;

export interface Body {
  id: string;
  name: string;
  kind: "star" | "planet" | "moon";
  a: number; // AU
  periodDays: number;
  L0: number; // mean longitude at J2000, degrees
  radius: number; // visual radius
  km: number; // real radius
  color: string;
  parent?: string;
  tex?: "earth" | "mars" | "moon";
  bands?: string[];
  ring?: boolean;
  destination?: "mars" | "moon";
}

export const BODIES: Body[] = [
  { id: "sun", name: "SUN", kind: "star", a: 0, periodDays: 1, L0: 0, radius: 2.4, km: 695700, color: "#fff1d0" },
  { id: "mercury", name: "MERCURY", kind: "planet", a: 0.387, periodDays: 87.97, L0: 252.25, radius: 0.35, km: 2439.7, color: "#8d8a84" },
  { id: "venus", name: "VENUS", kind: "planet", a: 0.723, periodDays: 224.7, L0: 181.98, radius: 0.8, km: 6051.8, color: "#c9b48a" },
  { id: "earth", name: "EARTH", kind: "planet", a: 1, periodDays: 365.256, L0: 100.46, radius: 0.85, km: 6371, color: "#6c8fa0", tex: "earth" },
  { id: "moon", name: "MOON", kind: "moon", a: 0, periodDays: 27.32, L0: 218.32, radius: 0.23, km: 1737.4, color: "#9a9a96", parent: "earth", tex: "moon", destination: "moon" },
  { id: "mars", name: "MARS", kind: "planet", a: 1.524, periodDays: 686.98, L0: 355.45, radius: 0.6, km: 3389.5, color: "#b5694a", tex: "mars", destination: "mars" },
  { id: "jupiter", name: "JUPITER", kind: "planet", a: 5.203, periodDays: 4332.59, L0: 34.4, radius: 3.0, km: 69911, color: "#c8a98a", bands: ["#b99b7e", "#d8c3a5", "#a9856a", "#e2d2b8", "#b08868", "#cdb396"] },
  { id: "saturn", name: "SATURN", kind: "planet", a: 9.537, periodDays: 10759.22, L0: 49.94, radius: 2.5, km: 58232, color: "#d3bf94", bands: ["#cdb98c", "#dcc9a0", "#c2ab7c", "#e0d1ae"], ring: true },
  { id: "uranus", name: "URANUS", kind: "planet", a: 19.19, periodDays: 30688.5, L0: 313.23, radius: 1.5, km: 25362, color: "#9bc3c9" },
  { id: "neptune", name: "NEPTUNE", kind: "planet", a: 30.07, periodDays: 60182, L0: 304.88, radius: 1.4, km: 24622, color: "#5f86b8" },
];

export const bodyById = (id: string) => BODIES.find((b) => b.id === id);
export const MOON_VISUAL_ORBIT = 2.4;
export const MOON_REAL_KM = 384400;

const lonAt = (b: Body, t: number) => (b.L0 + (360 * (t - J2000)) / (b.periodDays * DAY_MS)) * D2R;

export function bodyPos(id: string, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  if (id === "sun") return out.set(0, 0, 0);
  if (id === "voyager1") return voyagerPos(t, out);
  const b = bodyById(id)!;
  if (b.id === "moon") {
    const e = bodyPos("earth", t, new THREE.Vector3());
    const L = lonAt(b, t);
    return out.set(e.x + MOON_VISUAL_ORBIT * Math.cos(L), 0, e.z - MOON_VISUAL_ORBIT * Math.sin(L));
  }
  const r = ORBIT_K * Math.sqrt(b.a);
  const L = lonAt(b, t);
  return out.set(r * Math.cos(L), 0, -r * Math.sin(L));
}

/** Real (circular-orbit) heliocentric position in AU on the ecliptic plane. */
export function realPos(id: string, t: number): [number, number, number] {
  if (id === "sun") return [0, 0, 0];
  if (id === "voyager1") {
    const v = voyagerPos(t, new THREE.Vector3());
    const au = voyagerAU(t);
    const l = v.length() || 1;
    return [(v.x / l) * au, (v.y / l) * au, (v.z / l) * au];
  }
  const b = bodyById(id)!;
  if (b.id === "moon") {
    const e = realPos("earth", t);
    const L = lonAt(b, t);
    const d = MOON_REAL_KM / AU_KM;
    return [e[0] + d * Math.cos(L), 0, e[2] - d * Math.sin(L)];
  }
  const L = lonAt(b, t);
  return [b.a * Math.cos(L), 0, -b.a * Math.sin(L)];
}

export function realDistanceKm(a: string, b: string, t: number) {
  const pa = realPos(a, t);
  const pb = realPos(b, t);
  return Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]) * AU_KM;
}

// ---- Voyager 1 (simplified, labelled as such in the UI) ----
const T_J = Date.UTC(1979, 2, 5);
const T_S = Date.UTC(1980, 10, 12);
const T_PB = Date.UTC(1990, 1, 14);
const T_HP = Date.UTC(2012, 7, 25);
const TABLE: [number, number][] = [
  [VOYAGER_LAUNCH, 1],
  [T_J, 5.2],
  [T_S, 9.54],
  [T_PB, 40.5],
  [T_HP, 121.6],
];

export function voyagerAU(t: number) {
  if (t <= TABLE[0][0]) return 1;
  for (let i = 1; i < TABLE.length; i++) {
    if (t <= TABLE[i][0]) {
      const [t0, a0] = TABLE[i - 1];
      const [t1, a1] = TABLE[i];
      return a0 + ((a1 - a0) * (t - t0)) / (t1 - t0);
    }
  }
  return 121.6 + ((t - T_HP) / YEAR_MS) * 3.6;
}

export function voyagerPos(t: number, out = new THREE.Vector3()): THREE.Vector3 {
  t = Math.min(t, VOYAGER_NOW);
  const tmp = new THREE.Vector3();
  if (t <= VOYAGER_LAUNCH) return bodyPos("earth", VOYAGER_LAUNCH, out);
  if (t <= T_J) {
    const f = (t - VOYAGER_LAUNCH) / (T_J - VOYAGER_LAUNCH);
    return out.copy(bodyPos("earth", VOYAGER_LAUNCH, tmp)).lerp(bodyPos("jupiter", T_J, new THREE.Vector3()), f);
  }
  if (t <= T_S) {
    const f = (t - T_J) / (T_S - T_J);
    return out.copy(bodyPos("jupiter", T_J, tmp)).lerp(bodyPos("saturn", T_S, new THREE.Vector3()), f);
  }
  const s = bodyPos("saturn", T_S, tmp);
  const dir = new THREE.Vector3(s.x, 0, s.z).normalize();
  const k = Math.min(1, (t - T_S) / (2 * YEAR_MS));
  const lat = 35 * D2R * (k * k * (3 - 2 * k));
  const r = ORBIT_K * Math.sqrt(voyagerAU(t));
  return out.set(dir.x * Math.cos(lat) * r, Math.sin(lat) * r, dir.z * Math.cos(lat) * r);
}

export function voyagerTrail(tNow: number, n = 220) {
  const end = Math.min(tNow, VOYAGER_NOW);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    pts.push(voyagerPos(VOYAGER_LAUNCH + ((end - VOYAGER_LAUNCH) * i) / n, new THREE.Vector3()));
  }
  return pts;
}
